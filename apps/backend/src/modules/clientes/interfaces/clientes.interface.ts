import { Cliente } from '../../../database/entities/cliente.entity';

export type ClienteSinPassword = Omit<Cliente, 'passwordHash'>;

export interface PaginatedClientes {
  data: ClienteSinPassword[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
