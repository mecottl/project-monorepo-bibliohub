import { StripeService } from '@infra/stripe/stripe.service';
import { ConfiguracionService } from '@modules/configuracion/services/configuracion.service';
import { CONFIG } from '@modules/configuracion/config-claves';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import Stripe from 'stripe';
import { Carrito } from '@modules/carrito/entities/carrito.entity';
import { ItemCarrito } from '@modules/carrito/entities/item-carrito.entity';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { PedidoLinea } from '../entities/pedido-linea.entity';
import { CheckoutDto } from '../dto/checkout.dto';
import { IniciarCheckoutResult, TotalesCheckout } from '../interfaces/pedidos.interface';
import { DireccionesService } from './direcciones.service';

// Cobro (Stripe) y creación del pedido: checkout, webhook y confirmación de pago.
@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Carrito)
    private readonly carritoRepository: Repository<Carrito>,
    @InjectRepository(ItemCarrito)
    private readonly itemCarritoRepository: Repository<ItemCarrito>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    @InjectRepository(PedidoLinea)
    private readonly pedidoRepository: Repository<PedidoLinea>,
    private readonly direcciones: DireccionesService,
    private readonly configuracion: ConfiguracionService,
    private readonly stripe: StripeService,
    private readonly dataSource: DataSource,
  ) {}

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
      await this.direcciones.buscarDireccionPropia(clienteId, dto.direccionId!);
    }

    const totales = await this.calcularTotales(clienteId, dto.tipoEntrega, puntosUsados);

    if (totales.total <= 0) {
      throw new BadRequestException('El total del pedido debe ser mayor a cero');
    }

    const paymentIntent = await this.stripe.api.paymentIntents.create({
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

    const subtotal = items.reduce(
      (acc, item) => acc + item.cantidad * Number(item.libro.precioVenta),
      0,
    );

    const tasaAcumulacion = await this.configuracion.valorNumerico(CONFIG.tasaPuntosAcumulacion);
    const envioDefault = await this.configuracion.valorNumerico(CONFIG.costoEnvioDefault);
    const envioGratisDesde = await this.configuracion.valorNumerico(CONFIG.envioGratisDesde);

    // Pesos de descuento por punto (configuracion.tasa_puntos_canje); misma tasa que usan las funciones SQL.
    const tasaCanje = await this.configuracion.valorNumerico(CONFIG.tasaPuntosCanje);
    const descuentoPuntos = puntosUsados > 0 ? puntosUsados * tasaCanje : 0;
    if (descuentoPuntos > subtotal) {
      throw new BadRequestException('Estás usando más puntos de los necesarios para este pedido');
    }
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

  async manejarWebhook(rawBody: Buffer, firma: string): Promise<void> {
    const evento = this.stripe.construirEvento(rawBody, firma);

    if (evento.type !== 'payment_intent.succeeded') {
      return;
    }

    await this.procesarPago(evento.data.object as Stripe.PaymentIntent);
  }

  // Alternativa al webhook (que requiere stripe listen / URL pública): el
  // frontend avisa al terminar el pago y se verifica directo con Stripe.
  async confirmarPago(
    clienteId: string,
    paymentIntentId: string,
  ): Promise<{ pedidoId: string | null }> {
    const paymentIntent = await this.stripe.api.paymentIntents.retrieve(paymentIntentId);
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
}
