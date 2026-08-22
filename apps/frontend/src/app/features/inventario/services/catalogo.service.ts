import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import {
  Autor,
  Categoria,
  CreateLibroPayload,
  Editorial,
  Libro,
  LibrosQuery,
  PaginatedLibros,
  UpdateLibroPayload
} from '../models/libro.model';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/catalogo`;

  buscarLibros(query: LibrosQuery): Observable<PaginatedLibros> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedLibros>(`${this.baseUrl}/libros`, { params });
  }

  obtenerLibro(id: string): Observable<Libro> {
    return this.http.get<Libro>(`${this.baseUrl}/libros/${id}`);
  }

  crearLibro(payload: CreateLibroPayload): Observable<Libro> {
    return this.http.post<Libro>(`${this.baseUrl}/libros`, payload);
  }

  actualizarLibro(id: string, payload: UpdateLibroPayload): Observable<Libro> {
    return this.http.patch<Libro>(`${this.baseUrl}/libros/${id}`, payload);
  }

  eliminarLibro(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/libros/${id}`);
  }

  listarAutores(): Observable<Autor[]> {
    return this.http.get<Autor[]>(`${this.baseUrl}/autores`);
  }

  listarEditoriales(): Observable<Editorial[]> {
    return this.http.get<Editorial[]>(`${this.baseUrl}/editoriales`);
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  listarStockBajo(): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${this.baseUrl}/stock-bajo`);
  }
}
