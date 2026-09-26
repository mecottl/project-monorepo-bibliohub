import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { Categoria, Libro, PaginatedLibros } from './tienda.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);
  private readonly API = API_BASE_URL;

  getLibros(filtros?: {
    titulo?: string;
    categoriaId?: string;
    orden?: string;
    direccion?: string;
    precioMin?: number;
    precioMax?: number;
    disponibles?: boolean;
    page?: number;
    limit?: number;
  }): Observable<PaginatedLibros> {
    let params = new HttpParams();
    if (filtros?.titulo) {
      params = params.set('titulo', filtros.titulo);
    }
    if (filtros?.categoriaId) {
      params = params.set('categoriaId', filtros.categoriaId);
    }
    for (const clave of ['orden', 'direccion', 'precioMin', 'precioMax', 'disponibles'] as const) {
      const valor = filtros?.[clave];
      if (valor !== undefined && valor !== null) params = params.set(clave, String(valor));
    }
    if (filtros?.page) {
      params = params.set('page', filtros.page);
    }
    if (filtros?.limit) {
      params = params.set('limit', filtros.limit);
    }

    return this.http.get<PaginatedLibros>(`${this.API}/catalogo/libros`, {
      params
    });
  }

  getLibro(id: string): Observable<Libro> {
    return this.http.get<Libro>(`${this.API}/catalogo/libros/${id}`);
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.API}/catalogo/categorias`);
  }
}
