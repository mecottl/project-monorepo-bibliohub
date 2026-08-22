export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface MovimientoInventario {
  id: string;
  libroId: string;
  empleadoId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo?: string;
  createdAt: string;
}

export interface PaginatedMovimientos {
  data: MovimientoInventario[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovimientosQuery {
  libroId?: string;
  tipo?: TipoMovimiento;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface CreateMovimientoPayload {
  libroId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo?: string;
}
