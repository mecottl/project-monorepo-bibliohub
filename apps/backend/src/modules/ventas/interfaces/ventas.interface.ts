import { Venta } from '../entities/venta.entity';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { Empleado } from '@modules/empleados/entities/empleado.entity';

// venta.cliente y venta.empleado vienen de un leftJoinAndSelect con la
// entidad completa (incluye passwordHash) — este tipo es lo que el
// controller realmente devuelve, después de que el service lo despoja.
export type VentaSegura = Omit<Venta, 'cliente' | 'empleado'> & {
  cliente?: Omit<Cliente, 'passwordHash'> | null;
  empleado: Omit<Empleado, 'passwordHash'>;
};

export interface PaginatedVentas {
  data: VentaSegura[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
