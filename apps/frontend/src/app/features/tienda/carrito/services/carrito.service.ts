import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { API_BASE_URL } from '../../../../core/api.config';
import { AuthService } from '../../../../core/auth/auth.service';
import { Carrito } from '../models/carrito.model';

const CARRITO_VACIO: Carrito = { id: '', items: [], totalItems: 0, subtotal: 0 };

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly baseUrl = `${API_BASE_URL}/carrito`;

  carrito = signal<Carrito>(CARRITO_VACIO);

  cargar(): void {
    if (!this.auth.isCliente()) return;
    this.http.get<Carrito>(this.baseUrl).subscribe((carrito) => this.carrito.set(carrito));
  }

  agregarItem(libroId: string, cantidad = 1) {
    return this.http
      .post<Carrito>(`${this.baseUrl}/items`, { libroId, cantidad })
      .pipe(tap((carrito) => this.carrito.set(carrito)));
  }

  actualizarItem(libroId: string, cantidad: number) {
    return this.http
      .patch<Carrito>(`${this.baseUrl}/items/${libroId}`, { cantidad })
      .pipe(tap((carrito) => this.carrito.set(carrito)));
  }

  quitarItem(libroId: string) {
    return this.http
      .delete<Carrito>(`${this.baseUrl}/items/${libroId}`)
      .pipe(tap((carrito) => this.carrito.set(carrito)));
  }

  vaciar() {
    return this.http.delete<Carrito>(this.baseUrl).pipe(tap((carrito) => this.carrito.set(carrito)));
  }

  limpiarLocal(): void {
    this.carrito.set(CARRITO_VACIO);
  }
}
