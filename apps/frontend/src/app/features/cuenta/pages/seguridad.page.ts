import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { CuentaService } from '@domain/cuenta/cuenta.service';

@Component({
  selector: 'app-cuenta-seguridad',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/styles/cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <h1 class="font-display">Correo y contraseña</h1>

      <form class="cuenta-card cuenta-form" [formGroup]="correoForm" (ngSubmit)="guardarCorreo()">
        <h2 class="font-display">Correo</h2>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" formControlName="email" autocomplete="email" />
        </div>
        @if (correoMensaje()) {
          <p class="cuenta-ok" role="status">{{ correoMensaje() }}</p>
        }
        @if (correoError()) {
          <p class="cuenta-error">{{ correoError() }}</p>
        }
        <button
          type="submit"
          class="btn-primary"
          [disabled]="correoForm.invalid || guardandoCorreo()"
        >
          {{ guardandoCorreo() ? 'Guardando…' : 'Guardar correo' }}
        </button>
      </form>

      <form
        class="cuenta-card cuenta-form"
        [formGroup]="passwordForm"
        (ngSubmit)="guardarPassword()"
      >
        <h2 class="font-display">Cambiar contraseña</h2>
        <div class="field">
          <label for="passwordActual">Contraseña actual</label>
          <input
            id="passwordActual"
            type="password"
            formControlName="passwordActual"
            autocomplete="current-password"
          />
        </div>
        <div class="field">
          <label for="passwordNueva">Nueva contraseña</label>
          <input
            id="passwordNueva"
            type="password"
            formControlName="passwordNueva"
            autocomplete="new-password"
          />
        </div>
        @if (passwordMensaje()) {
          <p class="cuenta-ok" role="status">{{ passwordMensaje() }}</p>
        }
        @if (passwordError()) {
          <p class="cuenta-error">{{ passwordError() }}</p>
        }
        <button
          type="submit"
          class="btn-primary"
          [disabled]="passwordForm.invalid || guardandoPassword()"
        >
          {{ guardandoPassword() ? 'Guardando…' : 'Actualizar contraseña' }}
        </button>
      </form>

      <div class="cuenta-card cuenta-form">
        <h2 class="font-display">Sesiones</h2>
        <button
          type="button"
          class="btn-outline"
          [disabled]="cerrandoTodas()"
          (click)="cerrarTodas()"
        >
          Cerrar sesión en todos los dispositivos
        </button>
      </div>
    </section>
  `,
})
export class SeguridadPage {
  private readonly cuenta = inject(CuentaService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  cerrandoTodas = signal(false);

  guardandoCorreo = signal(false);
  correoMensaje = signal<string | null>(null);
  correoError = signal<string | null>(null);
  guardandoPassword = signal(false);
  passwordMensaje = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  correoForm = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', Validators.required],
    passwordNueva: ['', [Validators.required, Validators.minLength(4)]],
  });

  constructor() {
    this.cuenta
      .perfil()
      .subscribe((perfil) => this.correoForm.patchValue({ email: perfil.email ?? '' }));
  }

  cerrarTodas(): void {
    this.cerrandoTodas.set(true);
    this.auth.cerrarSesionEnTodos().subscribe({ error: () => this.cerrandoTodas.set(false) });
  }

  guardarCorreo(): void {
    if (this.correoForm.invalid) return;
    this.guardandoCorreo.set(true);
    this.correoMensaje.set(null);
    this.correoError.set(null);

    this.cuenta.actualizarPerfil({ email: this.correoForm.getRawValue().email.trim() }).subscribe({
      next: () => {
        this.correoMensaje.set('Correo actualizado.');
        this.guardandoCorreo.set(false);
      },
      error: (err) => {
        this.correoError.set(err?.error?.message ?? 'No se pudo guardar el correo.');
        this.guardandoCorreo.set(false);
      },
    });
  }

  guardarPassword(): void {
    if (this.passwordForm.invalid) return;
    this.guardandoPassword.set(true);
    this.passwordMensaje.set(null);
    this.passwordError.set(null);

    const { passwordActual, passwordNueva } = this.passwordForm.getRawValue();
    this.cuenta.cambiarPassword(passwordActual, passwordNueva).subscribe({
      next: () => {
        this.passwordMensaje.set('Contraseña actualizada.');
        this.passwordForm.reset({ passwordActual: '', passwordNueva: '' });
        this.guardandoPassword.set(false);
      },
      error: (err) => {
        this.passwordError.set(err?.error?.message ?? 'No se pudo actualizar la contraseña.');
        this.guardandoPassword.set(false);
      },
    });
  }
}
