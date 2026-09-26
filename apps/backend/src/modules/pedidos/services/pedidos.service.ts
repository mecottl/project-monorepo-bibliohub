import { BitacoraService } from '@modules/bitacora/services/bitacora.service';
import { StripeService } from '@infra/stripe/stripe.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PedidoLinea } from '../entities/pedido-linea.entity';
import type { EstadoPedidoLinea } from '../entities/pedido-linea.entity';

// Consulta y gestión de pedidos en línea (historial del cliente y administración).
@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(PedidoLinea)
    private readonly pedidoRepository: Repository<PedidoLinea>,
    private readonly stripe: StripeService,
    private readonly dataSource: DataSource,
    private readonly bitacora: BitacoraService,
  ) {}

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

  async obtenerPedidoAdmin(id: string, baseUrl: string) {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: ['cliente', 'direccion', 'detalles', 'detalles.libro'],
    });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    const { cliente, ...resto } = pedido;
    return {
      ...this.mapPedido(resto as PedidoLinea, baseUrl),
      cliente: { id: cliente.id, nombre: cliente.nombre, telefono: cliente.telefono },
    };
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
      await this.bitacora.registrar({
        accion: 'cancelar_pedido',
        entidad: 'pedido_linea',
        entidadId: id,
        antes: {
          estado: pedido.estado,
          estadoPago: pedido.estadoPago,
          total: Number(pedido.total),
        },
        despues: { estado: 'cancelado' },
      });
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
      await this.stripe.api.refunds.create(
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
          libro: {
            ...libro,
            imagenUrl: imagenKey ? `${baseUrl}/uploads/portadas/${imagenKey}` : null,
          },
        };
      }),
    };
  }
}
