import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { Categoria, PaginatedLibros } from './tienda.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private http = inject(HttpClient);
  private readonly API = API_BASE_URL;

  getLibros(filtros?: {
    titulo?: string;
    categoriaId?: string;
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

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.API}/catalogo/categorias`);
  }
}
