import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import { CreateVentaPayload, Venta } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/ventas`;

  obtener(id: string): Observable<Venta> {
    return this.http.get<Venta>(`${this.baseUrl}/${id}`);
  }

  cancelar(id: string): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/${id}/cancelar`, {});
  }

  crear(payload: CreateVentaPayload): Observable<Venta> {
    return this.http.post<Venta>(this.baseUrl, payload);
  }
}
