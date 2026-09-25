import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { DataTableColumn } from '../../../../shared/data-table/data-table.model';
import { DataTableComponent } from '../../../../shared/data-table/data-table.component';
import { EmpleadosService } from '../../services/empleados.service';
import { Empleado } from '../../models/empleado.model';

type Tab = 'cuenta' | 'empleados';

@Component({
  selector: 'app-configuracion',
  imports: [ReactiveFormsModule, DataTableComponent],
  templateUrl: './configuracion.page.html',
  styleUrl: './configuracion.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionPage {
  private readonly fb = inject(FormBuilder);
  private readonly empleadosService = inject(EmpleadosService);
  readonly auth = inject(AuthService);

  tab = signal<Tab>('cuenta');

  empleados = signal<Empleado[]>([]);
  loadingEmpleados = signal(true);

  passwordMensaje = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  guardandoPassword = signal(false);

  nuevoEmpleadoError = signal<string | null>(null);
  creandoEmpleado = signal(false);

  passwordForm = this.fb.nonNullable.group({
    passwordActual: ['', [Validators.required]],
    passwordNueva: ['', [Validators.required, Validators.minLength(8)]]
  });

  nuevoEmpleadoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    usuario: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    rol: ['cajero' as 'cajero' | 'admin', [Validators.required]]
  });

  columnasEmpleados: DataTableColumn<Empleado>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'rol', label: 'Rol' },
    {
      key: 'activo',
      label: 'Estado',
      formatter: (value) => (value ? 'Activo' : 'Desactivado')
    }
  ];

  constructor() {
    this.cargarEmpleados();
  }

  cambiarTab(tab: Tab): void {
    this.tab.set(tab);
  }

  private cargarEmpleados(): void {
    this.loadingEmpleados.set(true);
    this.empleadosService.listar().subscribe({
      next: (data) => {
        this.empleados.set(data);
        this.loadingEmpleados.set(false);
      },
      error: () => this.loadingEmpleados.set(false)
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
      }
    });
  }

  crearEmpleado(): void {
    if (this.nuevoEmpleadoForm.invalid) return;

    this.creandoEmpleado.set(true);
    this.nuevoEmpleadoError.set(null);

    this.empleadosService.crear(this.nuevoEmpleadoForm.getRawValue()).subscribe({
      next: (empleado) => {
        this.empleados.update((actuales) => [...actuales, empleado]);
        this.creandoEmpleado.set(false);
        this.nuevoEmpleadoForm.reset({ nombre: '', usuario: '', password: '', rol: 'cajero' });
      },
      error: (err) => {
        this.creandoEmpleado.set(false);
        this.nuevoEmpleadoError.set(err?.error?.message ?? 'No se pudo crear el empleado.');
      }
    });
  }

  toggleActivo(empleado: Empleado): void {
    this.empleadosService.actualizar(empleado.id, { activo: !empleado.activo }).subscribe((actualizado) => {
      this.empleados.update((actuales) =>
        actuales.map((e) => (e.id === actualizado.id ? actualizado : e))
      );
    });
  }
}
