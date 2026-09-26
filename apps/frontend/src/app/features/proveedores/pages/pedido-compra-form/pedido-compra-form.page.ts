import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SearchInputComponent } from '@shared/ui/search-input/search-input.component';
import { ProveedoresService } from '../../services/proveedores.service';
import { CatalogoService } from '@domain/catalogo/catalogo.service';
import { Proveedor } from '../../models/proveedor.model';
import { Libro } from '@domain/catalogo/catalogo.model';

interface LineaPedido {
  libro: Libro;
  cantidadSolicitada: number;
  precioCosto: number;
}

@Component({
  selector: 'app-pedido-compra-form',
  imports: [RouterLink, ReactiveFormsModule, SearchInputComponent],
  templateUrl: './pedido-compra-form.page.html',
  styleUrl: './pedido-compra-form.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoCompraFormPage {
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  proveedores = signal<Proveedor[]>([]);
  resultadosBusqueda = signal<Libro[]>([]);
  lineas = signal<LineaPedido[]>([]);
  guardando = signal(false);
  errorMensaje = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    proveedorId: ['', [Validators.required]],
    notas: [''],
  });

  total = computed(() =>
    this.lineas().reduce((acc, l) => acc + l.cantidadSolicitada * l.precioCosto, 0),
  );

  constructor() {
    this.proveedoresService.listarProveedores().subscribe((data) => this.proveedores.set(data));
  }

  buscarLibro(termino: string): void {
    if (!termino.trim()) {
      this.resultadosBusqueda.set([]);
      return;
    }
    this.catalogoService.buscarLibros({ titulo: termino, limit: 5 }).subscribe((res) => {
      this.resultadosBusqueda.set(res.data);
    });
  }

  agregarLinea(libro: Libro): void {
    if (this.lineas().some((l) => l.libro.id === libro.id)) return;
    this.lineas.update((actuales) => [
      ...actuales,
      { libro, cantidadSolicitada: 1, precioCosto: Number(libro.precioCosto) },
    ]);
    this.resultadosBusqueda.set([]);
  }

  quitarLinea(libroId: string): void {
    this.lineas.update((actuales) => actuales.filter((l) => l.libro.id !== libroId));
  }

  actualizarCantidad(libroId: string, cantidad: number): void {
    this.lineas.update((actuales) =>
      actuales.map((l) => (l.libro.id === libroId ? { ...l, cantidadSolicitada: cantidad } : l)),
    );
  }

  actualizarPrecio(libroId: string, precio: number): void {
    this.lineas.update((actuales) =>
      actuales.map((l) => (l.libro.id === libroId ? { ...l, precioCosto: precio } : l)),
    );
  }

  guardar(): void {
    if (this.form.invalid || this.lineas().length === 0) {
      this.errorMensaje.set('Selecciona un proveedor y agrega al menos un libro.');
      return;
    }

    const valores = this.form.getRawValue();
    this.guardando.set(true);
    this.proveedoresService
      .crearPedido({
        proveedorId: valores.proveedorId,
        notas: valores.notas || undefined,
        items: this.lineas().map((l) => ({
          libroId: l.libro.id,
          cantidadSolicitada: l.cantidadSolicitada,
          precioCosto: l.precioCosto,
        })),
      })
      .subscribe({
        next: (pedido) => this.router.navigate(['/proveedores/pedidos', pedido.id]),
        error: (err) => {
          this.guardando.set(false);
          this.errorMensaje.set(err?.error?.message ?? 'No se pudo crear el pedido.');
        },
      });
  }
}
