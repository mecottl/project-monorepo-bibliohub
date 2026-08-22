import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import {
  CreateMovimientoPayload,
  MovimientoInventario,
  MovimientosQuery,
  PaginatedMovimientos
} from '../models/movimiento.model';

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/inventario`;

  buscarMovimientos(query: MovimientosQuery): Observable<PaginatedMovimientos> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<PaginatedMovimientos>(`${this.baseUrl}/movimientos`, { params });
  }

  registrarMovimiento(payload: CreateMovimientoPayload): Observable<MovimientoInventario> {
    return this.http.post<MovimientoInventario>(`${this.baseUrl}/movimientos`, payload);
  }
}
