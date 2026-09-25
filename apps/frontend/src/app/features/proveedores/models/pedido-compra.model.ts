import { Proveedor } from './proveedor.model';

export type EstadoPedidoCompra =
  | 'pendiente'
  | 'enviado'
  | 'recibido_parcial'
  | 'recibido'
  | 'cancelado';

export interface DetallePedidoCompra {
  id: string;
  pedidoCompraId: string;
  libroId: string;
  libro?: { id: string; titulo: string; isbn: string };
  cantidadSolicitada: number;
  cantidadRecibida: number;
  precioCosto: number;
  subtotalLinea: number;
}

export interface PedidoCompra {
  id: string;
  proveedorId: string;
  proveedor?: Proveedor;
  empleadoId: string;
  empleado?: { id: string; nombre: string };
  fecha: string;
  estado: EstadoPedidoCompra;
  total: number;
  notas: string | null;
  updatedAt: string;
  detalles?: DetallePedidoCompra[];
}

export interface PaginatedPedidosCompra {
  data: PedidoCompra[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ItemPedidoCompraPayload {
  libroId: string;
  cantidadSolicitada: number;
  precioCosto: number;
}

export interface CreatePedidoCompraPayload {
  proveedorId: string;
  notas?: string;
  items: ItemPedidoCompraPayload[];
}

export interface ItemRecepcionPayload {
  detalleId: string;
  cantidadRecibida: number;
}
