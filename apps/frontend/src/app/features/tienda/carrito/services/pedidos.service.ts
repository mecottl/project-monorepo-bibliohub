import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../../core/api.config';
import {
  CheckoutPayload,
  CreateDireccionPayload,
  DireccionEntrega,
  IniciarCheckoutResult,
  PedidoLinea
} from '../models/carrito.model';

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  listarDirecciones(): Observable<DireccionEntrega[]> {
    return this.http.get<DireccionEntrega[]>(`${this.baseUrl}/direcciones`);
  }

  crearDireccion(payload: CreateDireccionPayload): Observable<DireccionEntrega> {
    return this.http.post<DireccionEntrega>(`${this.baseUrl}/direcciones`, payload);
  }

  eliminarDireccion(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/direcciones/${id}`);
  }

  iniciarCheckout(payload: CheckoutPayload): Observable<IniciarCheckoutResult> {
    return this.http.post<IniciarCheckoutResult>(`${this.baseUrl}/pedidos/checkout`, payload);
  }

  confirmarPago(paymentIntentId: string): Observable<{ pedidoId: string | null }> {
    return this.http.post<{ pedidoId: string | null }>(`${this.baseUrl}/pedidos/confirmar-pago`, {
      paymentIntentId
    });
  }

  actualizarDireccion(id: string, cambios: Partial<CreateDireccionPayload>): Observable<DireccionEntrega> {
    return this.http.patch<DireccionEntrega>(`${this.baseUrl}/direcciones/${id}`, cambios);
  }

  listarPedidos(): Observable<PedidoLinea[]> {
    return this.http.get<PedidoLinea[]>(`${this.baseUrl}/pedidos`);
  }

  obtenerPedido(id: string): Observable<PedidoLinea> {
    return this.http.get<PedidoLinea>(`${this.baseUrl}/pedidos/${id}`);
  }
}
