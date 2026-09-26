import { StripeService } from '@infra/stripe/stripe.service';
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

  // Valida el carrito (existencia, vacío, stock) con mensajes claros y delega el cálculo a SQL.
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

    // El cálculo vive en SQL (calcular_totales_pedido), la misma función que usa
    // confirmar_pedido_linea(): la vista previa y el pedido final no pueden divergir.
    const [fila] = await this.dataSource.query(
      'SELECT * FROM calcular_totales_pedido($1, $2, $3)',
      [clienteId, tipoEntrega, puntosUsados],
    );
    const totales: TotalesCheckout = {
      subtotal: Number(fila.subtotal),
      descuentoPuntos: Number(fila.descuento_puntos),
      costoEnvio: Number(fila.costo_envio),
      total: Number(fila.total),
      puntosGanados: Number(fila.puntos_ganados),
    };
    if (totales.descuentoPuntos > totales.subtotal) {
      throw new BadRequestException('Estás usando más puntos de los necesarios para este pedido');
    }
    return totales;
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
