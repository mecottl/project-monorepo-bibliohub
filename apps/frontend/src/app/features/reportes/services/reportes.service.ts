import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import { LibroMasVendido, RendimientoEmpleado, VentasPorDia } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/reportes`;

  rendimientoEmpleados(): Observable<RendimientoEmpleado[]> {
    return this.http.get<RendimientoEmpleado[]>(`${this.baseUrl}/rendimiento-empleados`);
  }

  librosMasVendidos(): Observable<LibroMasVendido[]> {
    return this.http.get<LibroMasVendido[]>(`${this.baseUrl}/libros-mas-vendidos`);
  }

  ventasPorPeriodo(fechaDesde?: string, fechaHasta?: string): Observable<VentasPorDia[]> {
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    return this.http.get<VentasPorDia[]>(`${this.baseUrl}/ventas`, { params });
  }
}
