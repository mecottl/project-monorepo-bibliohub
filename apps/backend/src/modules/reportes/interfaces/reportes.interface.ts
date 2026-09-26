export interface RendimientoEmpleado {
  id: string;
  nombre: string;
  rol: string;
  totalVentas: number;
  montoTotal: number | null;
  primeraVenta: Date | null;
  ultimaVenta: Date | null;
}

export interface LibroMasVendido {
  id: string;
  isbn: string;
  titulo: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
  apareceEnVentas: number;
}

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
  estadoGrupo: 'completada' | 'en_proceso' | 'cancelada';
}

export interface HistorialVentas {
  data: VentaHistorial[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  resumen: { ventas: number; monto: number; canceladas: number; ticketPromedio: number };
}

export interface VentasPorDia {
  fecha: string;
  totalVentas: number;
  montoTotal: number;
}
