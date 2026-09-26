import { ChangeDetectionStrategy, Component, Injector, afterNextRender, inject, signal } from '@angular/core';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '@core/api.config';
import { CuentaService, TarjetaGuardada } from '@domain/cuenta/cuenta.service';

@Component({
  selector: 'app-cuenta-tarjetas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/styles/cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <h1 class="font-display">Facturación y tarjetas</h1>

      <div class="cuenta-lista">
        @for (t of tarjetas(); track t.id) {
          <div class="cuenta-fila">
            <span>
              <strong>{{ t.marca.toUpperCase() }}</strong> •••• {{ t.ultimos4 }}<br />
              <small>Vence {{ t.expMes }}/{{ t.expAnio }}</small>
            </span>
            <button type="button" class="cuenta-link-btn" (click)="eliminar(t.id)">Eliminar</button>
          </div>
        } @empty {
          <p class="cuenta-hint">No tienes tarjetas guardadas.</p>
        }
      </div>

      @if (formularioAbierto()) {
        <div class="cuenta-card">
          <h2 class="font-display">Agregar tarjeta</h2>
          <div id="stripe-tarjeta-element"></div>
          @if (error()) { <p class="cuenta-error">{{ error() }}</p> }
          <div class="cuenta-lista">
            <button type="button" class="btn-primary" [disabled]="guardando()" (click)="guardar()">
              {{ guardando() ? 'Guardando…' : 'Guardar tarjeta' }}
            </button>
            <button type="button" class="btn-outline" (click)="cancelar()">Cancelar</button>
          </div>
        </div>
      } @else {
        <button type="button" class="btn-primary" (click)="abrirFormulario()">+ Agregar tarjeta</button>
        @if (error()) { <p class="cuenta-error">{{ error() }}</p> }
      }
    </section>
  `
})
export class TarjetasPage {
  private readonly cuenta = inject(CuentaService);
  private readonly injector = inject(Injector);

  tarjetas = signal<TarjetaGuardada[]>([]);
  formularioAbierto = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.cuenta.tarjetas().subscribe({
      next: (data) => this.tarjetas.set(data),
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudieron cargar las tarjetas.')
    });
  }

  abrirFormulario(): void {
    this.error.set(null);
    if (!STRIPE_PUBLISHABLE_KEY) {
      this.error.set('Stripe no está configurado (falta NG_APP_STRIPE_PUBLISHABLE_KEY).');
      return;
    }

    this.cuenta.iniciarGuardadoTarjeta().subscribe({
      next: ({ clientSecret }) => {
        this.formularioAbierto.set(true);
        // App zoneless: hay que esperar al render real para que exista el div.
        afterNextRender(() => this.montar(clientSecret), { injector: this.injector });
      },
      error: (err) => this.error.set(err?.error?.message ?? 'No se pudo iniciar el guardado.')
    });
  }

  private async montar(clientSecret: string): Promise<void> {
    this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    if (!this.stripe) {
      this.error.set('No se pudo cargar Stripe.');
      return;
    }
    this.elements = this.stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: { colorPrimary: '#9c6b43', colorText: '#3a3128', fontFamily: 'inherit', borderRadius: '8px' }
      }
    });
    this.elements.create('payment').mount('#stripe-tarjeta-element');
  }

  async guardar(): Promise<void> {
    if (!this.stripe || !this.elements) return;
    this.guardando.set(true);
    this.error.set(null);

    const { error } = await this.stripe.confirmSetup({ elements: this.elements, redirect: 'if_required' });
    this.guardando.set(false);

    if (error) {
      this.error.set(error.message ?? 'No se pudo guardar la tarjeta.');
      return;
    }
    this.cancelar();
    this.cargar();
  }

  cancelar(): void {
    this.elements = null;
    this.formularioAbierto.set(false);
  }

  eliminar(id: string): void {
    this.cuenta.eliminarTarjeta(id).subscribe(() =>
      this.tarjetas.update((actuales) => actuales.filter((t) => t.id !== id))
    );
  }
}
