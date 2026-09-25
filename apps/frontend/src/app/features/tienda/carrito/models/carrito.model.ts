export interface ItemCarrito {
  id: string;
  libroId: string;
  cantidad: number;
  libro: {
    id: string;
    titulo: string;
    precioVenta: number;
    stockActual: number;
    imagenUrl: string | null;
  };
  subtotal: number;
}

export interface Carrito {
  id: string;
  items: ItemCarrito[];
  totalItems: number;
  subtotal: number;
}

export type TipoEntrega = 'recoger_en_tienda' | 'envio_a_domicilio';

export interface DireccionEntrega {
  id: string;
  clienteId: string;
  alias: string;
  calle: string;
  colonia: string | null;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  referencias: string | null;
  esPrincipal: boolean;
  activo: boolean;
  createdAt: string;
}

export type CreateDireccionPayload = Pick<
  DireccionEntrega,
  'calle' | 'ciudad' | 'estado' | 'codigoPostal'
> &
  Partial<Pick<DireccionEntrega, 'alias' | 'colonia' | 'referencias' | 'esPrincipal'>>;

export interface TotalesCheckout {
  subtotal: number;
  descuentoPuntos: number;
  costoEnvio: number;
  total: number;
  puntosGanados: number;
}

export interface IniciarCheckoutResult {
  clientSecret: string;
  totales: TotalesCheckout;
}

export interface CheckoutPayload {
  tipoEntrega: TipoEntrega;
  direccionId?: string;
  puntosUsados?: number;
}

export type EstadoPedidoLinea =
  | 'recibido'
  | 'en_preparacion'
  | 'listo'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export interface DetallePedidoLinea {
  id: string;
  libroId: string;
  libro?: { id: string; titulo: string; imagenUrl?: string | null };
  cantidad: number;
  precioUnitario: number;
  subtotalLinea: number;
}

export interface PedidoLinea {
  id: string;
  fecha: string;
  estado: EstadoPedidoLinea;
  tipoEntrega: TipoEntrega;
  subtotal: number;
  descuentoPuntos: number;
  costoEnvio: number;
  total: number;
  puntosGanados: number;
  estadoPago: 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';
  direccion?: DireccionEntrega | null;
  detalles?: DetallePedidoLinea[];
}
