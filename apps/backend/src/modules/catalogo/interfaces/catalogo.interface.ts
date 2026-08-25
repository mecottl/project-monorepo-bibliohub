import { Libro } from '../../../database/entities/libro.entity';

export type LibroConImagen = Omit<Libro, 'imagenKey'> & {
  imagenUrl: string | null;
};

export interface PaginatedLibros {
  data: LibroConImagen[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
