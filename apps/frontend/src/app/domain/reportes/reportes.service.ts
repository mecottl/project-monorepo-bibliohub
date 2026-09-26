import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import { HistorialQuery, HistorialVentas } from '@domain/reportes/historial.model';
import { LibroMasVendido, RendimientoEmpleado, VentasPorDia } from '@domain/reportes/reporte.model';

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

  historialVentas(query: HistorialQuery): Observable<HistorialVentas> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(query)) {
      if (valor !== undefined && valor !== null && valor !== '') params = params.set(clave, String(valor));
    }
    return this.http.get<HistorialVentas>(`${this.baseUrl}/historial-ventas`, { params });
  }

  ventasPorPeriodo(fechaDesde?: string, fechaHasta?: string): Observable<VentasPorDia[]> {
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    return this.http.get<VentasPorDia[]>(`${this.baseUrl}/ventas`, { params });
  }
}
