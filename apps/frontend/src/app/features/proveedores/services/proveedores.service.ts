import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api.config';
import {
  CreateProveedorPayload,
  Proveedor,
  UpdateProveedorPayload
} from '../models/proveedor.model';
import {
  CreatePedidoCompraPayload,
  ItemRecepcionPayload,
  PaginatedPedidosCompra,
  PedidoCompra
} from '../models/pedido-compra.model';

export interface QueryPedidosCompra {
  proveedorId?: string;
  estado?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  listarProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.baseUrl}/proveedores`);
  }

  obtenerProveedor(id: string): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.baseUrl}/proveedores/${id}`);
  }

  crearProveedor(payload: CreateProveedorPayload): Observable<Proveedor> {
    return this.http.post<Proveedor>(`${this.baseUrl}/proveedores`, payload);
  }

  actualizarProveedor(id: string, payload: UpdateProveedorPayload): Observable<Proveedor> {
    return this.http.patch<Proveedor>(`${this.baseUrl}/proveedores/${id}`, payload);
  }

  eliminarProveedor(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/proveedores/${id}`);
  }

  listarPedidos(query: QueryPedidosCompra): Observable<PaginatedPedidosCompra> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedPedidosCompra>(`${this.baseUrl}/pedidos-compra`, { params });
  }

  obtenerPedido(id: string): Observable<PedidoCompra> {
    return this.http.get<PedidoCompra>(`${this.baseUrl}/pedidos-compra/${id}`);
  }

  crearPedido(payload: CreatePedidoCompraPayload): Observable<PedidoCompra> {
    return this.http.post<PedidoCompra>(`${this.baseUrl}/pedidos-compra`, payload);
  }

  recibirPedido(id: string, items: ItemRecepcionPayload[]): Observable<PedidoCompra> {
    return this.http.post<PedidoCompra>(`${this.baseUrl}/pedidos-compra/${id}/recepcion`, { items });
  }

  cancelarPedido(id: string): Observable<PedidoCompra> {
    return this.http.post<PedidoCompra>(`${this.baseUrl}/pedidos-compra/${id}/cancelar`, {});
  }
}
