export interface ItemVentaPayload {
  libroId: string;
  cantidad: number;
}

export interface CreateVentaPayload {
  clienteTelefono?: string;
  medioPago: 'efectivo' | 'tarjeta';
  puntosUsados?: number;
  items: ItemVentaPayload[];
}

export interface DetalleVenta {
  id: string;
  libroId: string;
  cantidad: number;
  precioUnitario: string;
  subtotalLinea: string;
}

export interface Venta {
  id: string;
  clienteId: string | null;
  empleadoId: string;
  fecha: string;
  subtotal: string;
  descuentoPuntos: string;
  total: string;
  medioPago: 'efectivo' | 'tarjeta';
  puntosUsados: number;
  puntosGanados: number;
  estado: 'completada' | 'cancelada';
  detalles?: DetalleVenta[];
}
