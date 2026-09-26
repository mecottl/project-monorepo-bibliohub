import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { PedidosService } from '@domain/pedidos/pedidos.service';
import { EstadoPedidoLinea, PedidoLinea } from '@domain/pedidos/pedido.model';
import { ETIQUETAS_ESTADO, claseEstado, esActivo, numeroOrden, pasosRastreo } from '@domain/pedidos/pedido-estado';

const FILTROS: (EstadoPedidoLinea | 'activos')[] = [
  'activos', 'recibido', 'en_preparacion', 'listo', 'enviado', 'entregado', 'cancelado'
];

@Component({
  selector: 'app-pedidos-linea',
  imports: [CurrencyPipe, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../../shared/styles/cuenta-shared.css',
  template: `
    <section class="cuenta-page">
      <h1 class="font-display">Pedidos en línea</h1>

      <div class="cuenta-acciones" role="tablist" aria-label="Filtrar por estado">
        @for (f of filtros; track f) {
          <button
            type="button"
            role="tab"
            class="btn-outline"
            [class.is-active]="filtro() === f"
            [attr.aria-selected]="filtro() === f"
            (click)="filtro.set(f)"
          >
            {{ f === 'activos' ? 'En curso' : etiquetas[f] }}
          </button>
        }
      </div>

      @if (error()) { <p class="cuenta-error">{{ error() }}</p> }

      @if (cargando()) {
        <p class="cuenta-hint">Cargando...</p>
      } @else {
        @for (p of visibles(); track p.id) {
          <article class="compra">
            <div class="compra__cabecera">
              <span class="estado estado--{{ clase(p) }}">{{ etiquetas[p.estado] }}</span>
              <strong>Orden N. {{ orden(p) }}</strong>
              <span class="compra__fecha">{{ p.fecha | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <p class="cuenta-hint">
              {{ p.cliente?.nombre || 'Sin nombre' }} · {{ p.cliente?.telefono }} ·
              {{ p.tipoEntrega === 'envio_a_domicilio' ? 'Envío a domicilio' : 'Recoger en tienda' }} ·
              <strong>{{ p.total | currency }}</strong>
            </p>
            @if (p.tipoEntrega === 'envio_a_domicilio' && p.direccion; as d) {
              <p class="cuenta-hint">{{ d.calle }}, {{ d.colonia }} {{ d.ciudad }}, {{ d.estado }} {{ d.codigoPostal }}</p>
            }
            <ul class="pedido-items">
              @for (d of p.detalles; track d.id) {
                <li>{{ d.cantidad }} × {{ d.libro?.titulo }}</li>
              }
            </ul>
            @if (activo(p)) {
              <div class="cuenta-acciones">
                @if (siguiente(p); as sig) {
                  <button type="button" class="btn-primary" [disabled]="guardando() === p.id" (click)="cambiar(p, sig)">
                    Marcar como {{ etiquetas[sig].toLowerCase() }}
                  </button>
                }
                <button type="button" class="cuenta-link-btn" [disabled]="guardando() === p.id" (click)="cancelar(p)">
                  Cancelar pedido
                </button>
              </div>
            }
          </article>
        } @empty {
          <p class="cuenta-hint">No hay pedidos en este filtro.</p>
        }
      }
    </section>
  `,
  styles: `
    .btn-outline.is-active { background: var(--color-cafe-medio); color: white; }
    .pedido-items { margin: 0; padding-left: 18px; font-size: 14px; }
    .cuenta-acciones { flex-wrap: wrap; }
  `
})
export class PedidosLineaPage {
  private readonly pedidosService = inject(PedidosService);

  readonly filtros = FILTROS;
  readonly etiquetas = ETIQUETAS_ESTADO;
  readonly clase = (p: PedidoLinea) => claseEstado(p.estado);
  readonly orden = numeroOrden;
  readonly activo = esActivo;

  filtro = signal<EstadoPedidoLinea | 'activos'>('activos');
  private pedidos = signal<PedidoLinea[]>([]);
  cargando = signal(true);
  guardando = signal<string | null>(null);
  error = signal<string | null>(null);

  visibles = computed(() =>
    this.pedidos().filter((p) => (this.filtro() === 'activos' ? esActivo(p) : p.estado === this.filtro()))
  );

  constructor() {
    this.pedidosService.listarPedidosAdmin().subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los pedidos.');
        this.cargando.set(false);
      }
    });
  }

  siguiente(p: PedidoLinea): EstadoPedidoLinea | null {
    const pasos = pasosRastreo(p.tipoEntrega);
    return pasos[pasos.indexOf(p.estado) + 1] ?? null;
  }

  cancelar(p: PedidoLinea): void {
    const aviso =
      p.estadoPago === 'pagado'
        ? '¿Cancelar el pedido? Se reembolsará el pago, se devolverá el stock y se revertirán los puntos.'
        : '¿Cancelar el pedido? Se devolverá el stock y se revertirán los puntos.';
    if (confirm(aviso)) this.cambiar(p, 'cancelado');
  }

  cambiar(p: PedidoLinea, estado: EstadoPedidoLinea): void {
    this.guardando.set(p.id);
    this.error.set(null);
    this.pedidosService.cambiarEstado(p.id, estado).subscribe({
      next: () => {
        const reembolsado = estado === 'cancelado' && p.estadoPago === 'pagado';
        this.pedidos.update((lista) =>
          lista.map((x) =>
            x.id === p.id ? { ...x, estado, estadoPago: reembolsado ? 'reembolsado' : x.estadoPago } : x
          )
        );
        this.guardando.set(null);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo cambiar el estado.');
        this.guardando.set(null);
      }
    });
  }
}
