import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { EmpleadosService } from '@domain/empleados/empleados.service';

@Component({
  selector: 'app-configuracion',
  imports: [ReactiveFormsModule],
  templateUrl: './configuracion.page.html',
  styleUrl: '../../../../shared/styles/ajustes-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfiguracionPage {
  private readonly fb = inject(FormBuilder);
  private readonly empleadosService = inject(EmpleadosService);
  readonly auth = inject(AuthService);

  perfilMensaje = signal<string | null>(null);
  perfilError = signal<string | null>(null);
  guardandoPerfil = signal(false);

  passwordMensaje = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  guardandoPassword = signal(false);

  perfilForm = this.fb.nonNullable.group({
    nombre: [
      this.auth.currentUser()?.nombre ?? '',
      [Validators.required, Validators.maxLength(120)],
    ],
  });

  passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', [Validators.required]],
    passwordNueva: ['', [Validators.required, Validators.minLength(8)]],
  });

  cerrandoTodas = signal(false);

  cerrarTodas(): void {
    this.cerrandoTodas.set(true);
    this.auth.cerrarSesionEnTodos().subscribe({ error: () => this.cerrandoTodas.set(false) });
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) return;

    this.guardandoPerfil.set(true);
    this.perfilMensaje.set(null);
    this.perfilError.set(null);

    const nombre = this.perfilForm.getRawValue().nombre.trim();
    this.empleadosService.actualizarPerfil({ nombre }).subscribe({
      next: (empleado) => {
        this.auth.actualizarNombreLocal(empleado.nombre);
        this.guardandoPerfil.set(false);
        this.perfilMensaje.set('Cambios guardados.');
      },
      error: (err) => {
        this.guardandoPerfil.set(false);
        this.perfilError.set(err?.error?.message ?? 'No se pudo guardar.');
      },
    });
  }

  guardarPassword(): void {
    if (this.passwordForm.invalid) return;

    this.guardandoPassword.set(true);
    this.passwordMensaje.set(null);
    this.passwordError.set(null);

    this.empleadosService.cambiarPassword(this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.guardandoPassword.set(false);
        this.passwordMensaje.set('Contraseña actualizada.');
        this.passwordForm.reset({ passwordActual: '', passwordNueva: '' });
      },
      error: (err) => {
        this.guardandoPassword.set(false);
        this.passwordError.set(err?.error?.message ?? 'No se pudo actualizar la contraseña.');
      },
    });
  }
}
