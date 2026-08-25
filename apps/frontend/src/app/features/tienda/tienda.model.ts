export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Libro {
  id: string;
  titulo: string;
  precioVenta: number;
  stockActual: number;
  categoria?: Categoria;
  imagenUrl: string | null;
}

export interface PaginatedLibros {
  data: Libro[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
