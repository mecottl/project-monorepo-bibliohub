import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PedidosService } from '@domain/pedidos/pedidos.service';
import { DireccionEntrega } from '@domain/pedidos/pedido.model';

@Component({
  selector: 'app-cuenta-direcciones',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/styles/cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <h1 class="font-display">Mis direcciones</h1>

      <div class="cuenta-lista">
        @for (d of direcciones(); track d.id) {
          <div class="cuenta-fila">
            <span>
              <strong>{{ d.alias }}</strong>
              @if (d.esPrincipal) { <span class="cuenta-insignia">Principal</span> }<br />
              <small>{{ d.calle }}{{ d.colonia ? ', ' + d.colonia : '' }}, {{ d.ciudad }}, {{ d.estado }} {{ d.codigoPostal }}</small>
            </span>
            <span class="cuenta-acciones">
              @if (!d.esPrincipal) {
                <button type="button" class="cuenta-link-btn cuenta-link-btn--editar" (click)="hacerPrincipal(d)">Usar como principal</button>
              }
              <button type="button" class="cuenta-link-btn cuenta-link-btn--editar" (click)="editar(d)">Editar</button>
              <button type="button" class="cuenta-link-btn" (click)="eliminar(d.id)">Eliminar</button>
            </span>
          </div>
        } @empty {
          <p class="cuenta-hint">Aún no guardas ninguna dirección.</p>
        }
      </div>

      <form class="cuenta-card cuenta-form" [formGroup]="form" (ngSubmit)="guardar()">
        <h2 class="font-display">{{ editandoId() ? 'Editar dirección' : 'Agregar dirección' }}</h2>
        <div class="field">
          <label for="alias">Alias</label>
          <input id="alias" type="text" formControlName="alias" />
        </div>
        <div class="field">
          <label for="calle">Calle y número</label>
          <input id="calle" type="text" formControlName="calle" />
        </div>
        <div class="field">
          <label for="colonia">Colonia</label>
          <input id="colonia" type="text" formControlName="colonia" />
        </div>
        <div class="cuenta-form-row">
          <div class="field"><label for="ciudad">Ciudad</label><input id="ciudad" type="text" formControlName="ciudad" /></div>
          <div class="field"><label for="estado">Estado</label><input id="estado" type="text" formControlName="estado" /></div>
          <div class="field"><label for="cp">C.P.</label><input id="cp" type="text" formControlName="codigoPostal" /></div>
        </div>
        <div class="field">
          <label for="referencias">Referencias (opcional)</label>
          <input id="referencias" type="text" formControlName="referencias" />
        </div>
        @if (error()) { <p class="cuenta-error">{{ error() }}</p> }
        <div class="cuenta-acciones">
          <button type="submit" class="btn-primary" [disabled]="form.invalid">
            {{ editandoId() ? 'Guardar cambios' : 'Guardar dirección' }}
          </button>
          @if (editandoId()) {
            <button type="button" class="btn-outline" (click)="cancelarEdicion()">Cancelar</button>
          }
        </div>
      </form>
    </section>
  `
})
export class DireccionesPage {
  private readonly pedidos = inject(PedidosService);
  private readonly fb = inject(FormBuilder);

  direcciones = signal<DireccionEntrega[]>([]);
  error = signal<string | null>(null);
  editandoId = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    alias: ['Casa'],
    calle: ['', Validators.required],
    colonia: [''],
    ciudad: ['', Validators.required],
    estado: ['', Validators.required],
    codigoPostal: ['', Validators.required],
    referencias: ['']
  });

  constructor() {
    this.pedidos.listarDirecciones().subscribe((data) => this.direcciones.set(data));
  }

  editar(d: DireccionEntrega): void {
    this.editandoId.set(d.id);
    this.form.reset({
      alias: d.alias ?? 'Casa',
      calle: d.calle,
      colonia: d.colonia ?? '',
      ciudad: d.ciudad,
      estado: d.estado,
      codigoPostal: d.codigoPostal,
      referencias: d.referencias ?? ''
    });
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.form.reset({ alias: 'Casa' });
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.error.set(null);
    const id = this.editandoId();
    const valores = this.form.getRawValue();

    if (id) {
      this.pedidos.actualizarDireccion(id, valores).subscribe({
        next: (direccion) => {
          this.cancelarEdicion();
          this.recargar();
        },
        error: () => this.error.set('No se pudo actualizar la dirección.')
      });
      return;
    }

    this.pedidos.crearDireccion(valores).subscribe({
      next: (direccion) => {
        this.form.reset({ alias: 'Casa' });
        this.recargar();
      },
      error: () => this.error.set('No se pudo guardar la dirección.')
    });
  }

  hacerPrincipal(d: DireccionEntrega): void {
    this.pedidos.actualizarDireccion(d.id, { esPrincipal: true }).subscribe({
      next: () => this.recargar(),
      error: () => this.error.set('No se pudo cambiar la dirección principal.')
    });
  }

  private recargar(): void {
    this.pedidos.listarDirecciones().subscribe((data) => this.direcciones.set(data));
  }

  eliminar(id: string): void {
    this.pedidos.eliminarDireccion(id).subscribe(() =>
      {
        if (this.editandoId() === id) this.cancelarEdicion();
        this.recargar();
      }
    );
  }
}
