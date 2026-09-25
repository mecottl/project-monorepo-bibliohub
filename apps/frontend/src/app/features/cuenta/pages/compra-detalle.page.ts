import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PedidosService } from '../../tienda/carrito/services/pedidos.service';
import { PedidoLinea } from '../../tienda/carrito/models/carrito.model';
import { PedidoTrackerComponent } from '../pedido-tracker.component';
import { ETIQUETAS_ESTADO, claseEstado, numeroOrden } from '../pedido-estado';

@Component({
  selector: 'app-cuenta-compra-detalle',
  imports: [CurrencyPipe, DatePipe, RouterLink, PedidoTrackerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <a routerLink="/cuenta/compras" class="cuenta-hint">← Mis compras</a>

      @if (cargando()) {
        <p class="cuenta-hint">Cargando...</p>
      } @else if (pedido(); as pedido) {
        <div class="detalle">
          <div class="detalle__principal">
            <div class="detalle__titulo">
              <span class="estado estado--{{ clase(pedido) }}">{{ etiquetas[pedido.estado] }}</span>
              <h1 class="font-display">Orden N. {{ orden(pedido) }}</h1>
            </div>
            <p class="cuenta-hint">Realizado el {{ pedido.fecha | date: 'dd/MM/yyyy HH:mm' }}</p>

            <app-pedido-tracker [estado]="pedido.estado" [tipoEntrega]="pedido.tipoEntrega" />

            <div>
              @for (detalle of pedido.detalles; track detalle.id) {
                <div class="detalle__item">
                  @if (detalle.libro?.imagenUrl) {
                    <img [src]="detalle.libro!.imagenUrl" [alt]="'Portada de ' + detalle.libro!.titulo" />
                  } @else {
                    <div class="detalle__item-sin"></div>
                  }
                  <div>
                    <h3>{{ detalle.libro?.titulo }}</h3>
                    <p>{{ detalle.cantidad }} × {{ detalle.precioUnitario | currency }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <aside class="detalle__aside">
            <div class="detalle__panel">
              <h3>{{ total(pedido) }} items</h3>
              @for (detalle of pedido.detalles; track detalle.id) {
                <div class="detalle__linea">
                  <span>{{ detalle.cantidad }} x {{ detalle.libro?.titulo }}</span>
                  <span>{{ detalle.subtotalLinea | currency }}</span>
                </div>
              }
              @if (pedido.costoEnvio > 0) {
                <div class="detalle__linea"><span>Envío</span><span>{{ pedido.costoEnvio | currency }}</span></div>
              }
              @if (pedido.descuentoPuntos > 0) {
                <div class="detalle__linea"><span>Descuento por puntos</span><span>−{{ pedido.descuentoPuntos | currency }}</span></div>
              }
              <div class="detalle__total"><span>Total</span><span>{{ pedido.total | currency }}</span></div>
            </div>

            <div class="detalle__panel">
              <h3>Detalles de envío</h3>
              @if (pedido.tipoEntrega === 'envio_a_domicilio' && pedido.direccion; as d) {
                <div class="detalle__linea"><span>{{ d.calle }}</span></div>
                <div class="detalle__linea"><span>{{ d.colonia }} {{ d.ciudad }}, {{ d.estado }} {{ d.codigoPostal }}</span></div>
                @if (d.referencias) {
                  <div class="detalle__linea"><span>{{ d.referencias }}</span></div>
                }
              } @else {
                <div class="detalle__linea"><span>Recoger en tienda</span></div>
              }
              <div class="detalle__linea"><span>Pago</span><span>{{ pedido.estadoPago === 'pagado' ? 'Pagado' : pedido.estadoPago }}</span></div>
              @if (pedido.puntosGanados > 0) {
                <div class="detalle__linea"><span>Puntos ganados</span><span>+{{ pedido.puntosGanados }}</span></div>
              }
            </div>
          </aside>
        </div>
      } @else {
        <p class="cuenta-error">No encontramos este pedido.</p>
      }
    </section>
  `
})
export class CompraDetallePage {
  private readonly pedidosService = inject(PedidosService);

  pedido = signal<PedidoLinea | null>(null);
  cargando = signal(true);

  readonly etiquetas = ETIQUETAS_ESTADO;
  readonly clase = (pedido: PedidoLinea) => claseEstado(pedido.estado);
  readonly orden = numeroOrden;
  readonly total = (pedido: PedidoLinea) => (pedido.detalles ?? []).reduce((acc, d) => acc + d.cantidad, 0);

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
    this.pedidosService.obtenerPedido(id).subscribe({
      next: (pedido) => {
        this.pedido.set(pedido);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }
}
