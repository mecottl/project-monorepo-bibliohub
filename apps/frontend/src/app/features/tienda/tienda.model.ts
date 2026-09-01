export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Editorial {
  id: string;
  nombre: string;
}

export interface Autor {
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
  sinopsis: string | null;
  precioVenta: number;
  stockActual: number;
  categoria?: Categoria;
  editorial?: Editorial;
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
