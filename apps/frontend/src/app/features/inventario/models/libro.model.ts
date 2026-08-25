export interface Autor {
  id: string;
  nombre: string;
}

export interface Editorial {
  id: string;
  nombre: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface LibroAutor {
  autorId: string;
  rol: string;
  autor?: Autor;
}

export interface Libro {
  id: string;
  isbn: string;
  titulo: string;
  editorialId: string;
  editorial?: Editorial;
  categoriaId: string;
  categoria?: Categoria;
  precioVenta: number;
  precioCosto: number;
  stockActual: number;
  stockMinimo: number;
  activo: boolean;
  libroAutores?: LibroAutor[];
  imagenUrl: string | null;
}

export interface PaginatedLibros {
  data: Libro[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LibrosQuery {
  titulo?: string;
  autor?: string;
  isbn?: string;
  categoriaId?: string;
  editorialId?: string;
  page?: number;
  limit?: number;
}

export interface AutorRolPayload {
  autorId: string;
  rol: string;
}

export interface CreateLibroPayload {
  isbn: string;
  titulo: string;
  editorialId: string;
  categoriaId: string;
  precioVenta: number;
  precioCosto: number;
  stockActual: number;
  stockMinimo?: number;
  autores?: AutorRolPayload[];
}

export type UpdateLibroPayload = Partial<Omit<CreateLibroPayload, 'isbn'>>;
