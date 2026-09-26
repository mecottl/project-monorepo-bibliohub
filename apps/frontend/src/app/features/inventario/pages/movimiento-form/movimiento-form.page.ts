import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';
import { InventarioService } from '../../services/inventario.service';
import { CatalogoService } from '@domain/catalogo/catalogo.service';
import { Libro } from '@domain/catalogo/catalogo.model';
import { MovimientoInventario, TipoMovimiento } from '../../models/movimiento.model';

function cantidadNoCero(control: { value: number | null }): Record<string, boolean> | null {
  return !control.value ? { cero: true } : null;
}

interface OpcionTipo {
  valor: TipoMovimiento;
  titulo: string;
  simbolo: string;
  detalle: string;
}

const TIPOS: OpcionTipo[] = [
  { valor: 'entrada', titulo: 'Entrada', simbolo: '+', detalle: 'Llegan libros' },
  { valor: 'salida', titulo: 'Salida', simbolo: '−', detalle: 'Salen libros' },
  { valor: 'ajuste', titulo: 'Ajuste', simbolo: '±', detalle: 'Corregir conteo' }
];

const MOTIVOS: Record<TipoMovimiento, string[]> = {
  entrada: ['Compra a proveedor', 'Devolución de cliente', 'Reposición'],
  salida: ['Dañado', 'Merma', 'Devolución a proveedor', 'Extravío'],
  ajuste: ['Conteo físico', 'Corrección de captura']
};

@Component({
  selector: 'app-movimiento-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './movimiento-form.page.html',
  styleUrl: './movimiento-form.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovimientoFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly inventarioService = inject(InventarioService);
  private readonly catalogoService = inject(CatalogoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly tipos = TIPOS;

  libroId = this.route.snapshot.paramMap.get('id') ?? '';
  libro = signal<Libro | null>(null);
  movimientos = signal<MovimientoInventario[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  errorMensaje = signal<string | null>(null);
  exito = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    tipo: this.fb.nonNullable.control<TipoMovimiento>('entrada', Validators.required),
    cantidad: this.fb.nonNullable.control(1, [Validators.required, cantidadNoCero]),
    motivo: ['']
  });

  private valores = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue()
  });

  tipo = computed(() => this.valores().tipo ?? 'entrada');
  motivosSugeridos = computed(() => MOTIVOS[this.tipo()]);

  autores = computed(
    () =>
      this.libro()
        ?.libroAutores?.map((la) => la.autor?.nombre)
        .filter(Boolean)
        .join(', ') ?? ''
  );

  // Cambio con signo tal como lo espera el backend: entrada +, salida −, ajuste con su propio signo.
  delta = computed(() => {
    const cantidad = Number(this.valores().cantidad) || 0;
    const tipo = this.tipo();
    return tipo === 'salida' ? -Math.abs(cantidad) : tipo === 'entrada' ? Math.abs(cantidad) : cantidad;
  });

  stockResultante = computed(() => (this.libro()?.stockActual ?? 0) + this.delta());
  stockNegativo = computed(() => this.stockResultante() < 0);
  bajoMinimo = computed(() => {
    const libro = this.libro();
    return !!libro && !this.stockNegativo() && this.stockResultante() <= libro.stockMinimo;
  });
  stockBajoActual = computed(() => {
    const libro = this.libro();
    return !!libro && libro.stockActual <= libro.stockMinimo;
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.catalogoService.obtenerLibro(this.libroId).subscribe({
      next: (libro) => {
        this.libro.set(libro);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
    this.inventarioService
      .buscarMovimientos({ libroId: this.libroId, limit: 6 })
      .subscribe((res) => this.movimientos.set(res.data));
  }

  elegirTipo(tipo: TipoMovimiento): void {
    this.form.controls.tipo.setValue(tipo);
    this.form.controls.cantidad.setValue(Math.abs(this.form.controls.cantidad.value) || 1);
    this.form.controls.motivo.setValue('');
  }

  cambiarCantidad(paso: number): void {
    const actual = Number(this.form.controls.cantidad.value) || 0;
    let siguiente = actual + paso;
    // Entrada/salida solo piden la magnitud; el ajuste puede ser negativo (sin pasar por 0).
    if (this.tipo() !== 'ajuste') siguiente = Math.max(1, siguiente);
    else if (siguiente === 0) siguiente = paso > 0 ? 1 : -1;
    this.form.controls.cantidad.setValue(siguiente);
  }

  usarMotivo(motivo: string): void {
    this.form.controls.motivo.setValue(motivo);
  }

  guardar(): void {
    if (this.form.invalid || !this.libroId || this.stockNegativo()) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);
    this.exito.set(null);

    const { tipo, motivo } = this.form.getRawValue();
    this.inventarioService
      .registrarMovimiento({ libroId: this.libroId, tipo, cantidad: this.delta(), motivo: motivo.trim() || undefined })
      .subscribe({
        next: (mov) => {
          this.guardando.set(false);
          this.exito.set(`Stock actualizado: ${mov.stockAnterior} → ${mov.stockNuevo}`);
          this.form.patchValue({ cantidad: 1, motivo: '' });
          this.cargar();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.errorMensaje.set(
            err.status === 400
              ? (err.error?.message ?? 'Movimiento inválido: revisa el tipo y la cantidad.')
              : 'No se pudo registrar el movimiento.'
          );
        }
      });
  }

  volver(): void {
    this.router.navigate(['/inventario']);
  }
}
