import { Injectable, computed, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE = 'tema';

function guardado(): Tema | null {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'claro' || v === 'oscuro' ? v : null;
  } catch {
    return null;
  }
}

const consulta = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Tema efectivo: la elección manual guardada o, si no hay, la preferencia del sistema. */
function resolver(): Tema {
  return guardado() ?? (consulta().matches ? 'oscuro' : 'claro');
}

/** Se llama antes de arrancar Angular (main.ts) para que la primera pintura ya use el tema correcto. */
export function iniciarTema(): void {
  document.documentElement.dataset['theme'] = resolver() === 'oscuro' ? 'dark' : 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly tema = signal<Tema>(resolver());
  readonly esOscuro = computed(() => this.tema() === 'oscuro');

  constructor() {
    // Mientras el usuario no elija a mano, se sigue al sistema en vivo.
    consulta().addEventListener('change', () => {
      if (!guardado()) this.aplicar(resolver());
    });
  }

  alternar(): void {
    const nuevo: Tema = this.esOscuro() ? 'claro' : 'oscuro';
    try {
      localStorage.setItem(CLAVE, nuevo);
    } catch {
      // sin almacenamiento: el cambio vale solo para esta sesión
    }
    this.aplicar(nuevo);
  }

  private aplicar(tema: Tema): void {
    document.documentElement.dataset['theme'] = tema === 'oscuro' ? 'dark' : 'light';
    this.tema.set(tema);
  }
}

/** Valor actual de una variable CSS (p. ej. '--color-superficie') para librerías que no leen CSS (Stripe, Chart.js). */
export function token(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
}

export function esOscuro(): boolean {
  return document.documentElement.dataset['theme'] === 'dark';
}
