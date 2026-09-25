import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { STRIPE_PUBLISHABLE_KEY } from '../../../../../core/api.config';
import { CarritoService } from '../../services/carrito.service';
import { PedidosService } from '../../services/pedidos.service';
import { DireccionEntrega, TipoEntrega, TotalesCheckout } from '../../models/carrito.model';

type Paso = 1 | 2 | 3;

@Component({
  selector: 'app-carrito-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './carrito-checkout.page.html',
  styleUrl: './carrito-checkout.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CarritoCheckoutPage {
  private readonly carritoService = inject(CarritoService);
  private readonly pedidosService = inject(PedidosService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  carrito = this.carritoService.carrito;
  paso = signal<Paso>(1);

  tipoEntrega = signal<TipoEntrega>('recoger_en_tienda');
  direcciones = signal<DireccionEntrega[]>([]);
  direccionSeleccionadaId = signal<string | null>(null);
  mostrarFormDireccion = signal(false);

  totales = signal<TotalesCheckout | null>(null);
  clientSecret = signal<string | null>(null);
  errorCheckout = signal<string | null>(null);
  errorPago = signal<string | null>(null);
  procesandoCheckout = signal(false);
  procesandoPago = signal(false);

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  puedeContinuarDireccion = computed(
    () => this.tipoEntrega() === 'recoger_en_tienda' || this.direccionSeleccionadaId() !== null
  );

  direccionForm = this.fb.nonNullable.group({
    alias: ['Casa'],
    calle: ['', [Validators.required]],
    colonia: [''],
    ciudad: ['', [Validators.required]],
    estado: ['', [Validators.required]],
    codigoPostal: ['', [Validators.required]],
    referencias: ['']
  });

  constructor() {
    this.carritoService.cargar();
    this.pedidosService.listarDirecciones().subscribe((data) => {
      this.direcciones.set(data);
      const principal = data.find((d) => d.esPrincipal) ?? data[0];
      if (principal) this.direccionSeleccionadaId.set(principal.id);
    });
  }

  // --- Paso 1: carrito ---

  actualizarCantidad(libroId: string, cantidad: number): void {
    if (cantidad <= 0) {
      this.carritoService.quitarItem(libroId).subscribe();
      return;
    }
    this.carritoService.actualizarItem(libroId, cantidad).subscribe();
  }

  quitarItem(libroId: string): void {
    this.carritoService.quitarItem(libroId).subscribe();
  }

  vaciarCarrito(): void {
    this.carritoService.vaciar().subscribe();
  }

  irAPaso2(): void {
    this.paso.set(2);
  }

  // --- Paso 2: dirección ---

  seleccionarTipoEntrega(tipo: TipoEntrega): void {
    this.tipoEntrega.set(tipo);
  }

  seleccionarDireccion(id: string): void {
    this.direccionSeleccionadaId.set(id);
    this.mostrarFormDireccion.set(false);
  }

  abrirFormNuevaDireccion(): void {
    this.mostrarFormDireccion.set(true);
  }

  guardarNuevaDireccion(): void {
    if (this.direccionForm.invalid) return;

    this.pedidosService.crearDireccion(this.direccionForm.getRawValue()).subscribe((direccion) => {
      this.direcciones.update((actuales) => [...actuales, direccion]);
      this.direccionSeleccionadaId.set(direccion.id);
      this.mostrarFormDireccion.set(false);
      this.direccionForm.reset({ alias: 'Casa' });
    });
  }

  async irAPaso3(): Promise<void> {
    if (!this.puedeContinuarDireccion()) return;

    this.procesandoCheckout.set(true);
    this.errorCheckout.set(null);

    this.pedidosService
      .iniciarCheckout({
        tipoEntrega: this.tipoEntrega(),
        direccionId: this.tipoEntrega() === 'envio_a_domicilio' ? this.direccionSeleccionadaId()! : undefined
      })
      .subscribe({
        next: (resultado) => {
          this.totales.set(resultado.totales);
          this.clientSecret.set(resultado.clientSecret);
          this.paso.set(3);
          this.procesandoCheckout.set(false);
          // La app es zoneless (sin zone.js) — un setTimeout no garantiza
          // esperar al render de Angular tras paso.set(3) (reproducido en
          // vivo: IntegrationError, el div del paso 3 todavía no existía).
          // afterNextRender sí espera al siguiente ciclo de render real.
          afterNextRender(() => this.montarStripeElements(resultado.clientSecret), {
            injector: this.injector
          });
        },
        error: (err) => {
          this.procesandoCheckout.set(false);
          this.errorCheckout.set(err?.error?.message ?? 'No se pudo iniciar el pago.');
        }
      });
  }

  // --- Paso 3: pago ---

  private async montarStripeElements(clientSecret: string): Promise<void> {
    if (!STRIPE_PUBLISHABLE_KEY) {
      this.errorPago.set('Stripe no está configurado (falta NG_APP_STRIPE_PUBLISHABLE_KEY).');
      return;
    }

    this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
    if (!this.stripe) {
      this.errorPago.set('No se pudo cargar Stripe.');
      return;
    }

    this.elements = this.stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#9c6b43',
          colorBackground: '#ffffff',
          colorText: '#3a3128',
          fontFamily: 'inherit',
          borderRadius: '8px'
        }
      }
    });

    const paymentElement = this.elements.create('payment');
    paymentElement.mount('#stripe-payment-element');
  }

  async pagar(): Promise<void> {
    if (!this.stripe || !this.elements) return;

    this.procesandoPago.set(true);
    this.errorPago.set(null);

    const { error, paymentIntent } = await this.stripe.confirmPayment({
      elements: this.elements,
      redirect: 'if_required'
    });

    if (error) {
      this.procesandoPago.set(false);
      this.errorPago.set(error.message ?? 'No se pudo procesar el pago.');
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      // Sin depender del webhook: el backend verifica el pago con Stripe y crea el pedido.
      const irAConfirmacion = () => {
        this.carritoService.limpiarLocal();
        this.router.navigate(['/carrito/confirmacion']);
      };
      this.pedidosService.confirmarPago(paymentIntent.id).subscribe({
        next: irAConfirmacion,
        error: irAConfirmacion
      });
      return;
    }

    this.procesandoPago.set(false);
    this.errorPago.set('El pago no se completó. Intenta de nuevo.');
  }
}
