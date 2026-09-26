export interface Autor {
  id: string;
  nombre: string;
  nacionalidad?: string | null;
  biografia?: string | null;
  activo?: boolean;
}

export interface Editorial {
  id: string;
  nombre: string;
  pais?: string | null;
  sitioWeb?: string | null;
  activo?: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export type CreateAutorPayload = Omit<Autor, 'id' | 'activo'>;
export type UpdateAutorPayload = Partial<CreateAutorPayload>;

export type CreateEditorialPayload = Omit<Editorial, 'id' | 'activo'>;
export type UpdateEditorialPayload = Partial<CreateEditorialPayload>;

export type CreateCategoriaPayload = Omit<Categoria, 'id' | 'activo'>;
export type UpdateCategoriaPayload = Partial<CreateCategoriaPayload>;

export interface LibroAutor {
  autorId: string;
  rol: string;
  autor?: Autor;
}

export interface Libro {
  id: string;
  isbn: string;
  titulo: string;
  sinopsis: string | null;
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
  stockBajo?: boolean;
  orden?: string;
  direccion?: string;
  precioMin?: number;
  precioMax?: number;
  disponibles?: boolean;
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
  sinopsis?: string;
  editorialId: string;
  categoriaId: string;
  precioVenta: number;
  precioCosto: number;
  stockActual: number;
  stockMinimo?: number;
  autores?: AutorRolPayload[];
}

export type UpdateLibroPayload = Partial<Omit<CreateLibroPayload, 'isbn'>>;
