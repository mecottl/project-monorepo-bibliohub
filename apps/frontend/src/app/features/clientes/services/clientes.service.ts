import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import {
  AjustePuntosPayload,
  Cliente,
  ClientesQuery,
  PaginatedClientes,
  UpdateClientePayload
} from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/clientes`;

  buscarClientes(query: ClientesQuery): Observable<PaginatedClientes> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedClientes>(this.baseUrl, { params });
  }

  obtenerCliente(id: string): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  actualizarCliente(id: string, payload: UpdateClientePayload): Observable<Cliente> {
    return this.http.patch<Cliente>(`${this.baseUrl}/${id}`, payload);
  }

  ajustarPuntos(id: string, payload: AjustePuntosPayload): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.baseUrl}/${id}/ajuste-puntos`, payload);
  }
}
