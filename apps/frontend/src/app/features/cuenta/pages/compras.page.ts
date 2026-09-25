import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PedidosService } from '../../tienda/carrito/services/pedidos.service';
import { PedidoLinea } from '../../tienda/carrito/models/carrito.model';
import { PedidoTrackerComponent } from '../pedido-tracker.component';
import { ETIQUETAS_ESTADO, claseEstado, esActivo, numeroOrden } from '../pedido-estado';

@Component({
  selector: 'app-cuenta-compras',
  imports: [CurrencyPipe, DatePipe, RouterLink, PedidoTrackerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <h1 class="font-display">Mis compras y rastreo</h1>

      @if (cargando()) {
        <p class="cuenta-hint">Cargando...</p>
      } @else if (pedidos().length === 0) {
        <p class="cuenta-hint">Todavía no tienes compras. <a routerLink="/inicio">Explorar libros</a></p>
      } @else {
        @for (pedido of pedidos(); track pedido.id) {
          <article class="compra">
            <div class="compra__cabecera">
              <span class="estado estado--{{ clase(pedido) }}">{{ etiquetas[pedido.estado] }}</span>
              <span class="compra__fecha">{{ pedido.fecha | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div class="compra__cuerpo">
              <div class="compra__portadas">
                @for (detalle of primeros(pedido); track detalle.id) {
                  @if (detalle.libro?.imagenUrl) {
                    <img [src]="detalle.libro!.imagenUrl" [alt]="'Portada de ' + detalle.libro!.titulo" />
                  } @else {
                    <span>{{ detalle.libro?.titulo }}</span>
                  }
                }
              </div>
              <div class="compra__info">
                <span class="compra__orden">Orden N. {{ orden(pedido) }}</span>
                <span class="compra__total">{{ pedido.total | currency }}</span>
              </div>
              <a class="btn-primary" [routerLink]="['/cuenta/compras', pedido.id]">Ver detalles</a>
            </div>
            @if (activo(pedido)) {
              <app-pedido-tracker [estado]="pedido.estado" [tipoEntrega]="pedido.tipoEntrega" />
            }
          </article>
        }
      }
    </section>
  `
})
export class ComprasPage {
  private readonly pedidosService = inject(PedidosService);

  pedidos = signal<PedidoLinea[]>([]);
  cargando = signal(true);

  readonly etiquetas = ETIQUETAS_ESTADO;
  readonly clase = (pedido: PedidoLinea) => claseEstado(pedido.estado);
  readonly orden = numeroOrden;
  readonly activo = esActivo;
  readonly primeros = (pedido: PedidoLinea) => (pedido.detalles ?? []).slice(0, 3);

  constructor() {
    this.pedidosService.listarPedidos().subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }
}
