import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CatalogoBusquedaService {
  termino = signal('');

  actualizar(valor: string): void {
    this.termino.set(valor);
  }

  limpiar(): void {
    this.termino.set('');
  }
}
