import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import {
  Autor,
  Categoria,
  CreateAutorPayload,
  CreateCategoriaPayload,
  CreateEditorialPayload,
  CreateLibroPayload,
  Editorial,
  Libro,
  LibrosQuery,
  PaginatedLibros,
  UpdateAutorPayload,
  UpdateCategoriaPayload,
  UpdateEditorialPayload,
  UpdateLibroPayload,
} from '@domain/catalogo/catalogo.model';

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

  crearAutor(payload: CreateAutorPayload): Observable<Autor> {
    return this.http.post<Autor>(`${this.baseUrl}/autores`, payload);
  }

  actualizarAutor(id: string, payload: UpdateAutorPayload): Observable<Autor> {
    return this.http.patch<Autor>(`${this.baseUrl}/autores/${id}`, payload);
  }

  eliminarAutor(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/autores/${id}`);
  }

  listarEditoriales(): Observable<Editorial[]> {
    return this.http.get<Editorial[]>(`${this.baseUrl}/editoriales`);
  }

  crearEditorial(payload: CreateEditorialPayload): Observable<Editorial> {
    return this.http.post<Editorial>(`${this.baseUrl}/editoriales`, payload);
  }

  actualizarEditorial(id: string, payload: UpdateEditorialPayload): Observable<Editorial> {
    return this.http.patch<Editorial>(`${this.baseUrl}/editoriales/${id}`, payload);
  }

  eliminarEditorial(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/editoriales/${id}`);
  }

  listarCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.baseUrl}/categorias`);
  }

  crearCategoria(payload: CreateCategoriaPayload): Observable<Categoria> {
    return this.http.post<Categoria>(`${this.baseUrl}/categorias`, payload);
  }

  actualizarCategoria(id: string, payload: UpdateCategoriaPayload): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.baseUrl}/categorias/${id}`, payload);
  }

  eliminarCategoria(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/categorias/${id}`);
  }

  listarStockBajo(): Observable<Libro[]> {
    return this.http.get<Libro[]>(`${this.baseUrl}/stock-bajo`);
  }

  subirPortada(id: string, archivo: File): Observable<Libro> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<Libro>(`${this.baseUrl}/libros/${id}/portada`, formData);
  }

  eliminarPortada(id: string): Observable<Libro> {
    return this.http.delete<Libro>(`${this.baseUrl}/libros/${id}/portada`);
  }
}
