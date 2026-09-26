import { Proveedor } from '../entities/proveedor.entity';
import { PedidoCompra } from '../entities/pedido-compra.entity';
import { Empleado } from '@modules/empleados/entities/empleado.entity';

export interface Paginado<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PaginatedProveedores = Paginado<Proveedor>;

// El empleado relacionado nunca debe traer passwordHash hacia afuera de la API
// (mismo criterio que VentasService.mapVenta).
export type PedidoCompraSeguro = Omit<PedidoCompra, 'empleado'> & {
  empleado: Omit<Empleado, 'passwordHash'>;
};

export type PaginatedPedidosCompra = Paginado<PedidoCompraSeguro>;
