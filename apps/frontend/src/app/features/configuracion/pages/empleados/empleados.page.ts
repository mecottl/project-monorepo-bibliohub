import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableColumn } from '@shared/data-table/data-table.model';
import { DataTableComponent } from '@shared/data-table/data-table.component';
import { EmpleadosService } from '../../services/empleados.service';
import { Empleado } from '../../models/empleado.model';

@Component({
  selector: 'app-empleados',
  imports: [ReactiveFormsModule, DataTableComponent],
  templateUrl: './empleados.page.html',
  styleUrl: '../configuracion/configuracion.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmpleadosPage {
  private readonly fb = inject(FormBuilder);
  private readonly empleadosService = inject(EmpleadosService);

  empleados = signal<Empleado[]>([]);
  loadingEmpleados = signal(true);
  nuevoEmpleadoError = signal<string | null>(null);
  creandoEmpleado = signal(false);

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
    this.empleadosService.listar().subscribe({
      next: (data) => {
        this.empleados.set(data);
        this.loadingEmpleados.set(false);
      },
      error: () => this.loadingEmpleados.set(false)
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
