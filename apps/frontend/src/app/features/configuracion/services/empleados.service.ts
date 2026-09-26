import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import {
  ChangePasswordPayload,
  CreateEmpleadoPayload,
  Empleado,
  UpdateEmpleadoPayload
} from '../models/empleado.model';

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/empleados`;

  listar(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.baseUrl);
  }

  crear(payload: CreateEmpleadoPayload): Observable<Empleado> {
    return this.http.post<Empleado>(this.baseUrl, payload);
  }

  actualizar(id: string, payload: UpdateEmpleadoPayload): Observable<Empleado> {
    return this.http.patch<Empleado>(`${this.baseUrl}/${id}`, payload);
  }

  actualizarPerfil(payload: { nombre: string }): Observable<Empleado> {
    return this.http.patch<Empleado>(`${this.baseUrl}/me`, payload);
  }

  cambiarPassword(payload: ChangePasswordPayload): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/me/password`, payload);
  }
}
