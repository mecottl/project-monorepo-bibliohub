export interface RendimientoEmpleado {
  id: string;
  nombre: string;
  rol: string;
  totalVentas: number;
  montoTotal: number | null;
  primeraVenta: string | null;
  ultimaVenta: string | null;
}

export interface LibroMasVendido {
  id: string;
  isbn: string;
  titulo: string;
  unidadesVendidas: number;
  ingresosGenerados: number;
  apareceEnVentas: number;
}

export interface VentasPorDia {
  fecha: string;
  totalVentas: number;
  montoTotal: number;
}
