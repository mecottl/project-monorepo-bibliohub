import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SearchInputComponent } from '../../../../shared/search-input/search-input.component';
import { CatalogoService } from '../../../inventario/services/catalogo.service';
import { Libro } from '../../../inventario/models/libro.model';
import { VentasService } from '../../services/ventas.service';
import { Venta } from '../../models/venta.model';

interface ItemCarrito {
  libro: Libro;
  cantidad: number;
}

type MedioPago = 'efectivo' | 'tarjeta';

@Component({
  selector: 'app-pos',
  imports: [SearchInputComponent],
  templateUrl: './pos.page.html',
  styleUrl: './pos.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PosPage {
  private readonly catalogoService = inject(CatalogoService);
  private readonly ventasService = inject(VentasService);

  resultados = signal<Libro[]>([]);
  buscoAlgunaVez = signal(false);
  carrito = signal<ItemCarrito[]>([]);
  clienteTelefono = signal('');

  // 'tarjeta' se puede seleccionar en el estado del componente, pero el radio está
  // deshabilitado en el template (ver Paso 5) — la integración real con terminal de
  // pago todavía no existe.
  medioPago = signal<MedioPago>('efectivo');

  cobrando = signal(false);
  errorMensaje = signal<string | null>(null);
  ventaConfirmada = signal<Venta | null>(null);

  total = computed(() =>
    this.carrito().reduce(
      (acc, item) => acc + Number(item.libro.precioVenta) * item.cantidad,
      0
    )
  );

  puedeCobrar = computed(
    () => this.carrito().length > 0 && this.medioPago() === 'efectivo' && !this.cobrando()
  );

  buscar(termino: string): void {
    this.buscoAlgunaVez.set(true);
    if (!termino) {
      this.resultados.set([]);
      return;
    }
    this.catalogoService.buscarLibros({ titulo: termino, limit: 8 }).subscribe({
      next: (res) => this.resultados.set(res.data),
      error: () => this.resultados.set([])
    });
  }

  cantidadEnCarrito(libroId: string): number {
    return this.carrito().find((item) => item.libro.id === libroId)?.cantidad ?? 0;
  }

  agregarAlCarrito(libro: Libro): void {
    const actual = this.carrito();
    const existente = actual.find((item) => item.libro.id === libro.id);

    if (existente) {
      this.carrito.set(
        actual.map((item) =>
          item.libro.id === libro.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      );
    } else {
      this.carrito.set([...actual, { libro, cantidad: 1 }]);
    }
  }

  // Interacción mínima para bajar cantidad/quitar sin agregar un botón nuevo al
  // diseño: click en el "X n" del renglón del carrito resta uno. Ver "Decisiones de
  // diseño" en la guía — el maquetado no resuelve esto explícitamente.
  quitarUno(libroId: string): void {
    const actual = this.carrito();
    const item = actual.find((i) => i.libro.id === libroId);
    if (!item) return;

    if (item.cantidad <= 1) {
      this.carrito.set(actual.filter((i) => i.libro.id !== libroId));
    } else {
      this.carrito.set(
        actual.map((i) => (i.libro.id === libroId ? { ...i, cantidad: i.cantidad - 1 } : i))
      );
    }
  }

  cobrar(): void {
    if (!this.puedeCobrar()) return;

    this.cobrando.set(true);
    this.errorMensaje.set(null);

    this.ventasService
      .crear({
        clienteTelefono: this.clienteTelefono() || undefined,
        medioPago: this.medioPago(),
        items: this.carrito().map((item) => ({
          libroId: item.libro.id,
          cantidad: item.cantidad
        }))
      })
      .subscribe({
        next: (venta) => {
          this.cobrando.set(false);
          this.ventaConfirmada.set(venta);
          this.carrito.set([]);
          this.clienteTelefono.set('');
          this.resultados.set([]);
        },
        error: (err: HttpErrorResponse) => {
          this.cobrando.set(false);
          this.errorMensaje.set(
            err.status === 400
              ? (err.error?.message ?? 'No se pudo completar la venta.')
              : 'No se pudo completar la venta. Intenta de nuevo.'
          );
        }
      });
  }

  nuevaVenta(): void {
    this.ventaConfirmada.set(null);
  }
}
