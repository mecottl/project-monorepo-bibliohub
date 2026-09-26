import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { CuentaService } from '@domain/cuenta/cuenta.service';

@Component({
  selector: 'app-cuenta-perfil',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/styles/cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <h1 class="font-display">Mi perfil</h1>

      <form class="cuenta-card cuenta-form" [formGroup]="form" (ngSubmit)="guardar()">
        <div class="field">
          <label for="nombre">Nombre</label>
          <input id="nombre" type="text" formControlName="nombre" autocomplete="name" />
        </div>
        <div class="field">
          <label for="telefono">Teléfono</label>
          <input id="telefono" type="text" [value]="telefono()" readonly />
          <span class="cuenta-hint">No se puede cambiar.</span>
        </div>

        @if (mensaje()) { <p class="cuenta-ok" role="status">{{ mensaje() }}</p> }
        @if (error()) { <p class="cuenta-error">{{ error() }}</p> }

        <button type="submit" class="btn-primary" [disabled]="form.invalid || guardando()">
          {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </form>
    </section>
  `
})
export class PerfilPage {
  private readonly cuenta = inject(CuentaService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  telefono = signal('');
  guardando = signal(false);
  mensaje = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({ nombre: ['', [Validators.required, Validators.maxLength(120)]] });

  constructor() {
    this.cuenta.perfil().subscribe((perfil) => {
      this.telefono.set(perfil.telefono);
      this.form.patchValue({ nombre: perfil.nombre ?? '' });
    });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.guardando.set(true);
    this.mensaje.set(null);
    this.error.set(null);

    this.cuenta.actualizarPerfil({ nombre: this.form.getRawValue().nombre.trim() }).subscribe({
      next: (perfil) => {
        this.auth.actualizarNombreLocal(perfil.nombre ?? '');
        this.mensaje.set('Cambios guardados.');
        this.guardando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo guardar.');
        this.guardando.set(false);
      }
    });
  }
}
