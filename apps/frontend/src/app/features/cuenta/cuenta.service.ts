import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/api.config';
import { PedidoLinea } from '../tienda/carrito/models/carrito.model';

export interface Perfil {
  id: string;
  nombre: string | null;
  telefono: string;
  email: string | null;
  puntosSaldo: number;
  fechaRegistro: string;
}

export interface MovimientoPuntos {
  id: string;
  tipo: 'ganado' | 'canjeado';
  puntos: number;
  canal: 'pos' | 'online';
  concepto: string | null;
  fecha: string;
}

export interface PuntosCuenta {
  saldo: number;
  pesosPorPunto: number;
  pesosPorPuntoCanjeado: number;
  movimientos: MovimientoPuntos[];
}

export interface TarjetaGuardada {
  id: string;
  marca: string;
  ultimos4: string;
  expMes: number;
  expAnio: number;
}

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/cuenta`;

  perfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.baseUrl}/perfil`);
  }

  actualizarPerfil(cambios: { nombre?: string; email?: string }): Observable<Perfil> {
    return this.http.patch<Perfil>(`${this.baseUrl}/perfil`, cambios);
  }

  cambiarPassword(passwordActual: string, passwordNueva: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/password`, {
      passwordActual,
      passwordNueva
    });
  }

  comprasTienda(): Observable<PedidoLinea[]> {
    return this.http.get<PedidoLinea[]>(`${this.baseUrl}/compras-tienda`);
  }

  compraTienda(id: string): Observable<PedidoLinea> {
    return this.http.get<PedidoLinea>(`${this.baseUrl}/compras-tienda/${id}`);
  }

  puntos(): Observable<PuntosCuenta> {
    return this.http.get<PuntosCuenta>(`${this.baseUrl}/puntos`);
  }

  tarjetas(): Observable<TarjetaGuardada[]> {
    return this.http.get<TarjetaGuardada[]>(`${this.baseUrl}/tarjetas`);
  }

  iniciarGuardadoTarjeta(): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.baseUrl}/tarjetas/setup`, {});
  }

  eliminarTarjeta(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/tarjetas/${id}`);
  }
}
