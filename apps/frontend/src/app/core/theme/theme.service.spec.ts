import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeService, esOscuro, iniciarTema, token } from './theme.service';

// El entorno de pruebas no siempre trae localStorage/matchMedia: se sustituyen por dobles simples.
function instalarDobles(sistemaOscuro = false) {
  const datos = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
  });
  vi.stubGlobal('matchMedia', () => ({
    matches: sistemaOscuro,
    addEventListener: () => undefined,
  }));
  return datos;
}

describe('ThemeService', () => {
  beforeEach(() => {
    delete document.documentElement.dataset['theme'];
  });

  it('respeta la elección guardada al iniciar', () => {
    const datos = instalarDobles();
    datos.set('tema', 'oscuro');
    iniciarTema();
    expect(esOscuro()).toBe(true);
    datos.set('tema', 'claro');
    iniciarTema();
    expect(esOscuro()).toBe(false);
  });

  it('sin elección guardada sigue la preferencia del sistema', () => {
    instalarDobles(true);
    iniciarTema();
    expect(esOscuro()).toBe(true);
  });

  it('alternar cambia el atributo, la señal y guarda la elección', () => {
    const datos = instalarDobles();
    datos.set('tema', 'claro');
    const servicio = TestBed.inject(ThemeService);
    expect(servicio.esOscuro()).toBe(false);

    servicio.alternar();
    expect(servicio.esOscuro()).toBe(true);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(datos.get('tema')).toBe('oscuro');

    servicio.alternar();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(datos.get('tema')).toBe('claro');
  });

  it('token lee una variable CSS del documento', () => {
    document.documentElement.style.setProperty('--prueba-color', ' #123456 ');
    expect(token('--prueba-color')).toBe('#123456');
  });
});
