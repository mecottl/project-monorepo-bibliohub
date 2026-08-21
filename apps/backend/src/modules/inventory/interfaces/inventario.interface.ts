import { MovimientoInventario } from '../../../database/entities/movimiento-inventario.entity';

export interface PaginatedMovimientos {
  data: MovimientoInventario[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
