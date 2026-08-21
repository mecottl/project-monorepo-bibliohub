import { Libro } from '../../../database/entities/libro.entity';

export interface PaginatedLibros {
  data: Libro[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
