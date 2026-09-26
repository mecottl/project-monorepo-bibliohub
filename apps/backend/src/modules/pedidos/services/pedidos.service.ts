import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import Stripe from 'stripe';
import { DireccionEntrega } from '../../../database/entities/direccion-entrega.entity';
import { Carrito } from '../../../database/entities/carrito.entity';
import { ItemCarrito } from '../../../database/entities/item-carrito.entity';
import { Cliente } from '../../../database/entities/cliente.entity';
import { PedidoLinea } from '../../../database/entities/pedido-linea.entity';
import type { EstadoPedidoLinea } from '../../../database/entities/pedido-linea.entity';
import { Configuracion } from '../../../database/entities/configuracion.entity';
import { CreateDireccionDto } from '../dto/create-direccion.dto';
import { UpdateDireccionDto } from '../dto/update-direccion.dto';
import { asignarDefinidos } from '../../../common/asignar-definidos';
import { CheckoutDto } from '../dto/checkout.dto';
import { IniciarCheckoutResult, TotalesCheckout } from '../interfaces/pedidos.interface';

@Injectable()
export class PedidosService {
  private stripeClient: Stripe | null = null;

  constructor(
    @InjectRepository(DireccionEntrega)
    private readonly direccionRepository: Repository<DireccionEntrega>,
    @InjectRepository(Carrito)
    private readonly carritoRepository: Repository<Carrito>,
    @InjectRepository(ItemCarrito)
    private readonly itemCarritoRepository: Repository<ItemCarrito>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(PedidoLinea)
    private readonly pedidoRepository: Repository<PedidoLinea>,
    @InjectRepository(Configuracion)
    private readonly configuracionRepository: Repository<Configuracion>,
    private readonly dataSource: DataSource,
  ) {}

  // --- Direcciones ---

  async listarDirecciones(clienteId: string): Promise<DireccionEntrega[]> {
    return this.direccionRepository.find({
      where: { clienteId, activo: true },
      order: { esPrincipal: 'DESC', createdAt: 'DESC' },
    });
  }

  // Solo una dirección principal por cliente: se garantiza en una transacción. La primera dirección que
  // se guarda es principal; al eliminar la principal, la más reciente pasa a serlo.
  async crearDireccion(clienteId: string, dto: CreateDireccionDto): Promise<DireccionEntrega> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DireccionEntrega);
      const existentes = await repo.count({ where: { clienteId, activo: true } });
      const esPrincipal = dto.esPrincipal === true || existentes === 0;
      if (esPrincipal) await repo.update({ clienteId }, { esPrincipal: false });

      return repo.save(
        repo.create({ ...dto, clienteId, alias: dto.alias ?? 'Casa', activo: true, esPrincipal }),
      );
    });
  }

  async actualizarDireccion(
    clienteId: string,
    id: string,
    dto: UpdateDireccionDto,
  ): Promise<DireccionEntrega> {
    const direccion = await this.buscarDireccionPropia(clienteId, id);
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DireccionEntrega);
      if (dto.esPrincipal === true) await repo.update({ clienteId }, { esPrincipal: false });
      asignarDefinidos(direccion, dto);
      return repo.save(direccion);
    });
  }

  async eliminarDireccion(clienteId: string, id: string): Promise<{ message: string }> {
    const direccion = await this.buscarDireccionPropia(clienteId, id);
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DireccionEntrega);
      const eraPrincipal = direccion.esPrincipal;
      direccion.activo = false;
      direccion.esPrincipal = false;
      await repo.save(direccion);

      if (eraPrincipal) {
        const siguiente = await repo.findOne({
          where: { clienteId, activo: true },
          order: { createdAt: 'DESC' },
        });
        if (siguiente) await repo.update(siguiente.id, { esPrincipal: true });
      }
    });
    return { message: 'Dirección eliminada.' };
  }

  private async buscarDireccionPropia(clienteId: string, id: string): Promise<DireccionEntrega> {
    const direccion = await this.direccionRepository.findOne({ where: { id, clienteId } });
    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }
    return direccion;
  }

  // --- Checkout ---

  async iniciarCheckout(clienteId: string, dto: CheckoutDto): Promise<IniciarCheckoutResult> {
    const cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const puntosUsados = dto.puntosUsados ?? 0;
    if (puntosUsados > cliente.puntosSaldo) {
      throw new BadRequestException(
        `No tienes suficientes puntos (tienes ${cliente.puntosSaldo}, intentas usar ${puntosUsados})`,
      );
    }

    if (dto.tipoEntrega === 'envio_a_domicilio') {
      await this.buscarDireccionPropia(clienteId, dto.direccionId!);
    }

    const totales = await this.calcularTotales(clienteId, dto.tipoEntrega, puntosUsados);

    if (totales.total <= 0) {
      throw new BadRequestException('El total del pedido debe ser mayor a cero');
    }

    const paymentIntent = await this.stripe().paymentIntents.create({
      amount: Math.round(totales.total * 100),
      currency: 'mxn',
      metadata: {
        clienteId,
        direccionId: dto.direccionId ?? '',
        tipoEntrega: dto.tipoEntrega,
        puntosUsados: String(puntosUsados),
      },
    });

    if (!paymentIntent.client_secret) {
      throw new BadRequestException('Stripe no devolvió un client_secret');
    }

    return { clientSecret: paymentIntent.client_secret, totales };
  }

  // Réplica en TypeScript del cálculo que hace confirmar_pedido_linea() en SQL
  // (ver db/bibliohub_estructura.sql) — necesaria porque el monto a cobrar en
  // Stripe se define ANTES de llamar esa función (que solo se ejecuta tras
  // el webhook de pago exitoso). Si el carrito o configuracion cambian entre
  // el checkout y el webhook, el total cobrado y el total del pedido podrían
  // divergir — riesgo aceptado dado el tiempo típico de un pago con tarjeta
  // (segundos), no se implementó un mecanismo de reserva de precio.
  private async calcularTotales(
    clienteId: string,
    tipoEntrega: 'recoger_en_tienda' | 'envio_a_domicilio',
    puntosUsados: number,
  ): Promise<TotalesCheckout> {
    const carrito = await this.carritoRepository.findOne({ where: { clienteId } });
    if (!carrito) {
      throw new BadRequestException('No tienes un carrito activo');
    }

    const items = await this.itemCarritoRepository.find({
      where: { carritoId: carrito.id },
      relations: ['libro'],
    });

    if (items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }

    for (const item of items) {
      if (item.cantidad > item.libro.stockActual) {
        throw new BadRequestException(`Stock insuficiente para "${item.libro.titulo}"`);
      }
    }

    const subtotal = items.reduce((acc, item) => acc + item.cantidad * Number(item.libro.precioVenta), 0);

    const tasaAcumulacion = await this.leerConfiguracion('tasa_puntos_acumulacion');
    const envioDefault = await this.leerConfiguracion('costo_envio_default');
    const envioGratisDesde = await this.leerConfiguracion('envio_gratis_desde');

    const descuentoPuntos = puntosUsados > 0 ? puntosUsados * 1.0 : 0;
    const costoEnvio =
      tipoEntrega === 'envio_a_domicilio' ? (subtotal >= envioGratisDesde ? 0 : envioDefault) : 0;

    const totalNeto = Math.max(subtotal - descuentoPuntos, 0);

    return {
      subtotal,
      descuentoPuntos,
      costoEnvio,
      total: totalNeto + costoEnvio,
      puntosGanados: Math.floor(totalNeto / tasaAcumulacion),
    };
  }

  private async leerConfiguracion(clave: string): Promise<number> {
    const parametro = await this.configuracionRepository.findOne({ where: { clave } });
    if (!parametro) {
      throw new BadRequestException(`Falta el parámetro de configuración "${clave}"`);
    }
    return Number(parametro.valor);
  }

  // --- Webhook de Stripe ---

  async manejarWebhook(rawBody: Buffer, firma: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET no está configurado');
    }

    let evento: Stripe.Event;
    try {
      evento = this.stripe().webhooks.constructEvent(rawBody, firma, webhookSecret);
    } catch (error) {
      throw new BadRequestException(
        `Firma de webhook inválida: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    }

    if (evento.type !== 'payment_intent.succeeded') {
      return;
    }

    await this.procesarPago(evento.data.object as Stripe.PaymentIntent);
  }

  // Alternativa al webhook (que requiere stripe listen / URL pública): el
  // frontend avisa al terminar el pago y se verifica directo con Stripe.
  async confirmarPago(clienteId: string, paymentIntentId: string): Promise<{ pedidoId: string | null }> {
    const paymentIntent = await this.stripe().paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.metadata.clienteId !== clienteId) {
      throw new BadRequestException('El pago no corresponde a este cliente');
    }
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('El pago aún no está confirmado');
    }
    return { pedidoId: await this.procesarPago(paymentIntent) };
  }

  // Idempotente: webhook y confirmarPago pueden llegar ambos para el mismo pago.
  private async procesarPago(paymentIntent: Stripe.PaymentIntent): Promise<string | null> {
    const { clienteId, direccionId, tipoEntrega, puntosUsados } = paymentIntent.metadata;

    const buscar = () =>
      this.pedidoRepository.findOne({ where: { stripePaymentIntentId: paymentIntent.id } });

    const yaProcesado = await buscar();
    if (yaProcesado) {
      return yaProcesado.id;
    }

    let pedidoId: string;
    try {
      const resultado = await this.dataSource.query(
        'SELECT confirmar_pedido_linea($1, $2, $3, $4) AS id',
        [clienteId, direccionId || null, tipoEntrega, Number(puntosUsados)],
      );
      pedidoId = resultado[0].id;
    } catch (error) {
      // Carrera con el otro camino: el carrito ya se consumió, el pedido existe.
      const existente = await buscar();
      if (existente) return existente.id;
      throw error;
    }

    await this.pedidoRepository.update(pedidoId, {
      stripePaymentIntentId: paymentIntent.id,
      estadoPago: 'pagado',
      updatedAt: new Date(),
    });
    return pedidoId;
  }

  // --- Historial ---

  async listarPedidos(clienteId: string, baseUrl: string) {
    const pedidos = await this.pedidoRepository.find({
      where: { clienteId },
      relations: ['direccion', 'detalles', 'detalles.libro'],
      order: { fecha: 'DESC' },
    });
    return pedidos.map((pedido) => this.mapPedido(pedido, baseUrl));
  }

  async obtenerPedido(clienteId: string, id: string, baseUrl: string) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id, clienteId },
      relations: ['direccion', 'detalles', 'detalles.libro'],
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return this.mapPedido(pedido, baseUrl);
  }

  // --- Gestión de pedidos en línea (admin / cajero) ---

  async listarPedidosAdmin(estado: EstadoPedidoLinea | undefined, baseUrl: string) {
    const pedidos = await this.pedidoRepository.find({
      where: estado ? { estado } : {},
      relations: ['cliente', 'direccion', 'detalles', 'detalles.libro'],
      order: { fecha: 'DESC' },
    });
    return pedidos.map(({ cliente, ...pedido }) => ({
      ...this.mapPedido(pedido as PedidoLinea, baseUrl),
      cliente: { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono },
    }));
  }

  async cambiarEstado(id: string, nuevo: EstadoPedidoLinea) {
    const pedido = await this.pedidoRepository.findOne({ where: { id } });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'entregado' || pedido.estado === 'cancelado') {
      throw new BadRequestException(`El pedido ya está ${pedido.estado} y no puede cambiar`);
    }

    if (nuevo === 'cancelado') {
      await this.cancelarPedido(pedido);
      return { id, estado: nuevo };
    }

    // Recoger en tienda no pasa por "enviado".
    const pasos: EstadoPedidoLinea[] =
      pedido.tipoEntrega === 'envio_a_domicilio'
        ? ['recibido', 'en_preparacion', 'listo', 'enviado', 'entregado']
        : ['recibido', 'en_preparacion', 'listo', 'entregado'];
    if (pasos.indexOf(nuevo) <= pasos.indexOf(pedido.estado)) {
      throw new BadRequestException(`No se puede pasar de "${pedido.estado}" a "${nuevo}"`);
    }

    await this.pedidoRepository.update(id, { estado: nuevo, updatedAt: new Date() });
    return { id, estado: nuevo };
  }

  // Cancelar devuelve el stock, revierte los puntos (el trigger resincroniza el
  // saldo) y reembolsa en Stripe si el pedido ya estaba pagado.
  private async cancelarPedido(pedido: PedidoLinea): Promise<void> {
    let estadoPago = pedido.estadoPago;
    if (pedido.stripePaymentIntentId && pedido.estadoPago === 'pagado') {
      await this.stripe().refunds.create(
        { payment_intent: pedido.stripePaymentIntentId },
        { idempotencyKey: `reembolso-${pedido.id}` },
      );
      estadoPago = 'reembolsado';
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `UPDATE libro SET stock_actual = stock_actual + d.cantidad
           FROM detalle_pedido_linea d
          WHERE d.libro_id = libro.id AND d.pedido_linea_id = $1`,
        [pedido.id],
      );
      await manager.query('DELETE FROM transaccion_puntos WHERE pedido_linea_id = $1', [pedido.id]);
      await manager.update(PedidoLinea, pedido.id, {
        estado: 'cancelado',
        estadoPago,
        updatedAt: new Date(),
      });
    });
  }

  // El libro del detalle viaja con imagenUrl (misma convención que catalogo)
  // en vez del imagenKey interno del almacenamiento.
  private mapPedido(pedido: PedidoLinea, baseUrl: string) {
    return {
      ...pedido,
      detalles: (pedido.detalles ?? []).map((detalle) => {
        const { imagenKey, ...libro } = detalle.libro;
        return {
          ...detalle,
          libro: { ...libro, imagenUrl: imagenKey ? `${baseUrl}/uploads/portadas/${imagenKey}` : null },
        };
      }),
    };
  }

  private stripe(): Stripe {
    if (!this.stripeClient) {
      const apiKey = process.env.STRIPE_SECRET_KEY;
      if (!apiKey) {
        throw new BadRequestException(
          'Stripe no está configurado todavía (falta STRIPE_SECRET_KEY)',
        );
      }
      this.stripeClient = new Stripe(apiKey);
    }
    return this.stripeClient;
  }
}
