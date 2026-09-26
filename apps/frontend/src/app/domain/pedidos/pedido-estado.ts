import { EstadoPedidoLinea, PedidoLinea, TipoEntrega } from '@domain/pedidos/pedido.model';

export const ETIQUETAS_ESTADO: Record<EstadoPedidoLinea, string> = {
  recibido: 'Recibido',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

// Amarillo = en curso, verde = entregado, rojo = cancelado (como en el diseño).
export function claseEstado(estado: EstadoPedidoLinea): 'en-curso' | 'entregado' | 'cancelado' {
  if (estado === 'entregado') return 'entregado';
  if (estado === 'cancelado') return 'cancelado';
  return 'en-curso';
}

export function etiquetaEstado(pedido: PedidoLinea): string {
  if (pedido.origen === 'tienda') {
    return pedido.estado === 'cancelado' ? 'Cancelada' : 'Compra en tienda';
  }
  return ETIQUETAS_ESTADO[pedido.estado];
}

export function esActivo(pedido: PedidoLinea): boolean {
  if (pedido.origen === 'tienda') return false;
  return pedido.estado !== 'entregado' && pedido.estado !== 'cancelado';
}

// Recoger en tienda no pasa por "Enviado".
export function pasosRastreo(tipo: TipoEntrega): EstadoPedidoLinea[] {
  return tipo === 'envio_a_domicilio'
    ? ['recibido', 'en_preparacion', 'listo', 'enviado', 'entregado']
    : ['recibido', 'en_preparacion', 'listo', 'entregado'];
}

export function numeroOrden(pedido: PedidoLinea): string {
  return pedido.id.slice(0, 8).toUpperCase();
}
