import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ClientesService } from '../../services/clientes.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-detalle',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-detalle.page.html',
  styleUrl: './cliente-detalle.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClienteDetallePage {
  private readonly fb = inject(FormBuilder);
  private readonly clientesService = inject(ClientesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  clienteId = this.route.snapshot.paramMap.get('id')!;
  cliente = signal<Cliente | null>(null);
  cargando = signal(true);

  guardando = signal(false);
  errorMensaje = signal<string | null>(null);

  ajustando = signal(false);
  ajusteError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    cuentaActiva: [true]
  });

  ajusteForm = this.fb.nonNullable.group({
    tipo: 'ganado' as 'ganado' | 'canjeado',
    puntos: [0, [Validators.required, Validators.min(1)]],
    concepto: ['']
  });

  fechaRegistroFormateada = computed(() => {
    const cliente = this.cliente();
    return cliente ? new Date(cliente.fechaRegistro).toLocaleDateString('es-MX') : '';
  });

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.clientesService.obtenerCliente(this.clienteId).subscribe({
      next: (cliente) => {
        this.cliente.set(cliente);
        this.form.patchValue({
          nombre: cliente.nombre ?? '',
          email: cliente.email ?? '',
          cuentaActiva: cliente.cuentaActiva
        });
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.errorMensaje.set(null);
    const { nombre, email, cuentaActiva } = this.form.getRawValue();

    this.clientesService
      .actualizarCliente(this.clienteId, {
        nombre,
        email: email || undefined,
        cuentaActiva
      })
      .subscribe({
        next: (cliente) => {
          this.cliente.set(cliente);
          this.guardando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.errorMensaje.set(this.extraerMensajeError(err, 'No se pudo guardar el cliente.'));
        }
      });
  }

  ajustarPuntos(): void {
    if (this.ajusteForm.invalid) {
      this.ajusteForm.markAllAsTouched();
      return;
    }

    this.ajustando.set(true);
    this.ajusteError.set(null);
    const { tipo, puntos, concepto } = this.ajusteForm.getRawValue();

    this.clientesService.ajustarPuntos(this.clienteId, { tipo, puntos, concepto: concepto || undefined }).subscribe({
      next: (cliente) => {
        this.cliente.set(cliente);
        this.ajustando.set(false);
        this.ajusteForm.reset({ tipo: 'ganado', puntos: 0, concepto: '' });
      },
      error: (err: HttpErrorResponse) => {
        this.ajustando.set(false);
        this.ajusteError.set(
          this.extraerMensajeError(err, 'No se pudo ajustar el saldo de puntos.')
        );
      }
    });
  }

  volver(): void {
    this.router.navigate(['/clientes']);
  }

  private extraerMensajeError(err: HttpErrorResponse, porDefecto: string): string {
    const mensaje = err.error?.message;
    if (Array.isArray(mensaje)) return mensaje[0] ?? porDefecto;
    return typeof mensaje === 'string' ? mensaje : porDefecto;
  }
}
