import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/api.config';
import { AuthService } from '@core/auth/auth.service';
import { Libro } from '../tienda.model';

@Injectable({ providedIn: 'root' })
export class ListaDeseosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly baseUrl = `${API_BASE_URL}/lista-deseos`;

  ids = signal<ReadonlySet<string>>(new Set());

  cargarIds(): void {
    if (!this.auth.isCliente()) return;
    this.http.get<string[]>(`${this.baseUrl}/ids`).subscribe((ids) => this.ids.set(new Set(ids)));
  }

  listar(): Observable<Libro[]> {
    return this.http.get<Libro[]>(this.baseUrl);
  }

  esDeseado(libroId: string): boolean {
    return this.ids().has(libroId);
  }

  toggle(libroId: string): void {
    if (!this.auth.isCliente()) {
      this.router.navigate(['/login']);
      return;
    }

    const quitar = this.esDeseado(libroId);
    const peticion = quitar
      ? this.http.delete(`${this.baseUrl}/${libroId}`)
      : this.http.post(`${this.baseUrl}/${libroId}`, {});

    peticion.subscribe(() =>
      this.ids.update((actuales) => {
        const nuevos = new Set(actuales);
        if (quitar) nuevos.delete(libroId);
        else nuevos.add(libroId);
        return nuevos;
      })
    );
  }
}
