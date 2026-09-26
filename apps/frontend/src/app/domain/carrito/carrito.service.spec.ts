import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@core/auth/auth.service';
import { CarritoService } from './carrito.service';

describe('CarritoService', () => {
  let servicio: CarritoService;
  let http: HttpTestingController;
  let esCliente = true;

  beforeEach(() => {
    esCliente = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { isCliente: () => esCliente } },
      ],
    });
    servicio = TestBed.inject(CarritoService);
    http = TestBed.inject(HttpTestingController);
  });

  const carrito = { id: 'c1', items: [], totalItems: 3, subtotal: 300 };

  it('cargar no consulta al servidor si el usuario no es cliente', () => {
    esCliente = false;
    servicio.cargar();
    http.expectNone(() => true);
  });

  it('cargar guarda el carrito recibido', () => {
    servicio.cargar();
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/carrito')).flush(carrito);
    expect(servicio.carrito().totalItems).toBe(3);
  });

  it('agregar, actualizar y quitar reemplazan el carrito con la respuesta', () => {
    servicio.agregarItem('l1', 2).subscribe();
    const post = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/carrito/items'));
    expect(post.request.body).toEqual({ libroId: 'l1', cantidad: 2 });
    post.flush(carrito);
    expect(servicio.carrito().subtotal).toBe(300);

    servicio.actualizarItem('l1', 1).subscribe();
    http
      .expectOne((r) => r.method === 'PATCH' && r.url.endsWith('/carrito/items/l1'))
      .flush({ ...carrito, subtotal: 100 });
    expect(servicio.carrito().subtotal).toBe(100);

    servicio.quitarItem('l1').subscribe();
    http
      .expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/carrito/items/l1'))
      .flush({ ...carrito, items: [], subtotal: 0 });
    expect(servicio.carrito().subtotal).toBe(0);
  });

  it('limpiarLocal deja el carrito vacío sin llamar al servidor', () => {
    servicio.cargar();
    http.expectOne(() => true).flush(carrito);
    servicio.limpiarLocal();
    expect(servicio.carrito().totalItems).toBe(0);
    http.verify();
  });
});
