export type EstadoGrupo = 'completada' | 'en_proceso' | 'cancelada';

export interface VentaHistorial {
  id: string;
  canal: 'tienda' | 'en_linea';
  fecha: string;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  empleado: string | null;
  medioPago: string;
  unidades: number;
  subtotal: number;
  descuento: number;
  total: number;
  puntosGanados: number;
  puntosUsados: number;
  estado: string;
  estadoGrupo: EstadoGrupo;
}

export interface HistorialVentas {
  data: VentaHistorial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  resumen: { ventas: number; monto: number; canceladas: number; ticketPromedio: number };
}

export interface HistorialQuery {
  desde?: string;
  hasta?: string;
  canal?: string;
  estado?: string;
  busqueda?: string;
  orden?: string;
  direccion?: string;
  page?: number;
  limit?: number;
}

/** Detalle de una venta de tienda o de un pedido en línea (misma forma para las partidas). */
export interface DetalleHistorial {
  detalles: {
    id: string;
    cantidad: number;
    precioUnitario: number | string;
    subtotalLinea: number | string;
    libro?: { titulo: string } | null;
  }[];
}
