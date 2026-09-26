import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTableColumn } from '@shared/ui/data-table/data-table.model';
import { DataTableComponent } from '@shared/ui/data-table/data-table.component';
import { ConfirmModalComponent } from '@shared/ui/confirm-modal/confirm-modal.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { ProveedoresService } from '../../services/proveedores.service';
import { Proveedor } from '../../models/proveedor.model';

@Component({
  selector: 'app-proveedores-listado',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DataTableComponent,
    ConfirmModalComponent,
    EmptyStateComponent,
  ],
  templateUrl: './proveedores-listado.page.html',
  styleUrl: './proveedores-listado.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProveedoresListadoPage {
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly fb = inject(FormBuilder);

  proveedores = signal<Proveedor[]>([]);
  loading = signal(true);
  mostrarForm = signal(false);
  editando = signal<Proveedor | null>(null);
  aEliminar = signal<Proveedor | null>(null);
  errorMensaje = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    contactoNombre: [''],
    email: [''],
    telefono: [''],
    condicionesComerciales: [''],
  });

  columnas: DataTableColumn<Proveedor>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'contactoNombre', label: 'Contacto' },
    { key: 'email', label: 'Email' },
    { key: 'telefono', label: 'Teléfono' },
  ];

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.proveedoresService.listarProveedores().subscribe({
      next: (data) => {
        this.proveedores.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  abrirCrear(): void {
    this.editando.set(null);
    this.form.reset({
      nombre: '',
      contactoNombre: '',
      email: '',
      telefono: '',
      condicionesComerciales: '',
    });
    this.mostrarForm.set(true);
  }

  abrirEditar(proveedor: Proveedor): void {
    this.editando.set(proveedor);
    this.form.reset({
      nombre: proveedor.nombre,
      contactoNombre: proveedor.contactoNombre ?? '',
      email: proveedor.email ?? '',
      telefono: proveedor.telefono ?? '',
      condicionesComerciales: proveedor.condicionesComerciales ?? '',
    });
    this.mostrarForm.set(true);
  }

  cerrarForm(): void {
    this.mostrarForm.set(false);
    this.errorMensaje.set(null);
  }

  guardar(): void {
    if (this.form.invalid) return;

    const valores = this.form.getRawValue();
    const payload = {
      nombre: valores.nombre,
      contactoNombre: valores.contactoNombre || undefined,
      email: valores.email || undefined,
      telefono: valores.telefono || undefined,
      condicionesComerciales: valores.condicionesComerciales || undefined,
    };

    const edicion = this.editando();
    const peticion = edicion
      ? this.proveedoresService.actualizarProveedor(edicion.id, payload)
      : this.proveedoresService.crearProveedor(payload);

    peticion.subscribe({
      next: (proveedor) => {
        if (edicion) {
          this.proveedores.update((actuales) =>
            actuales.map((p) => (p.id === proveedor.id ? proveedor : p)),
          );
        } else {
          this.proveedores.update((actuales) => [...actuales, proveedor]);
        }
        this.cerrarForm();
      },
      error: () => this.errorMensaje.set('No se pudo guardar el proveedor.'),
    });
  }

  pedirEliminar(proveedor: Proveedor): void {
    this.aEliminar.set(proveedor);
  }

  confirmarEliminar(): void {
    const proveedor = this.aEliminar();
    if (!proveedor) return;

    this.proveedoresService.eliminarProveedor(proveedor.id).subscribe(() => {
      this.proveedores.update((actuales) => actuales.filter((p) => p.id !== proveedor.id));
      this.aEliminar.set(null);
    });
  }

  cancelarEliminar(): void {
    this.aEliminar.set(null);
  }
}
