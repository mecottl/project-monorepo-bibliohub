import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { InventarioService } from '../../services/inventario.service';
import { TipoMovimiento } from '../../models/movimiento.model';

function cantidadNoCero(control: { value: number }): Record<string, boolean> | null {
  return control.value === 0 ? { cero: true } : null;
}

@Component({
  selector: 'app-movimiento-form',
  imports: [ReactiveFormsModule],
  templateUrl: './movimiento-form.page.html',
  styleUrl: './movimiento-form.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MovimientoFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly inventarioService = inject(InventarioService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  guardando = signal(false);
  errorMensaje = signal<string | null>(null);
  libroId = this.route.snapshot.paramMap.get('id') ?? '';

  form = this.fb.nonNullable.group({
    tipo: this.fb.nonNullable.control<TipoMovimiento>('entrada', Validators.required),
    cantidad: [1, [Validators.required, cantidadNoCero]],
    motivo: ['']
  });

  esAjuste = computed(() => this.form.controls.tipo.value === 'ajuste');

  guardar(): void {
    if (this.form.invalid || !this.libroId) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);

    const { tipo, cantidad, motivo } = this.form.getRawValue();
    // El backend exige que "salida" viaje con cantidad negativa y "entrada" con
    // cantidad positiva (validarSignoPorTipo en InventarioService); "ajuste" acepta
    // cualquier signo. Entrada/salida solo piden la magnitud, el signo se calcula aquí.
    const cantidadConSigno =
      tipo === 'salida' ? -Math.abs(cantidad) : tipo === 'entrada' ? Math.abs(cantidad) : cantidad;

    this.inventarioService
      .registrarMovimiento({ libroId: this.libroId, tipo, cantidad: cantidadConSigno, motivo })
      .subscribe({
        next: () => this.router.navigate(['/inventario']),
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

  cancelar(): void {
    this.router.navigate(['/inventario']);
  }
}
