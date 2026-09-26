import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import { BitacoraPaginada, FiltrosBitacora } from '@domain/bitacora/bitacora.model';

@Injectable({ providedIn: 'root' })
export class BitacoraService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/bitacora`;

  listar(filtros: FiltrosBitacora): Observable<BitacoraPaginada> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== '') params = params.set(clave, String(valor));
    }
    return this.http.get<BitacoraPaginada>(this.baseUrl, { params });
  }

  acciones(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/acciones`);
  }
}
