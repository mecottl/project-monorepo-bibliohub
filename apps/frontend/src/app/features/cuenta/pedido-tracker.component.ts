import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EstadoPedidoLinea, TipoEntrega } from '@features/tienda/carrito/models/carrito.model';
import { ETIQUETAS_ESTADO, pasosRastreo } from './pedido-estado';

@Component({
  selector: 'app-pedido-tracker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (estado() === 'cancelado') {
      <p class="tracker__cancelado">Este pedido fue cancelado.</p>
    } @else {
      <ol class="tracker" aria-label="Rastreo del pedido">
        @for (paso of pasos(); track paso; let i = $index) {
          <li
            [class.is-done]="i < indice()"
            [class.is-current]="i === indice()"
            [attr.aria-current]="i === indice() ? 'step' : null"
          >
            <span class="tracker__punto">{{ i < indice() ? '✓' : i + 1 }}</span>
            <span class="tracker__label">{{ etiquetas[paso] }}</span>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    .tracker { display: flex; list-style: none; margin: 0; padding: 0; }
    .tracker li { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; }
    .tracker li:not(:first-child)::before {
      content: ''; position: absolute; top: 14px; right: 50%; width: 100%; height: 2px; background: var(--color-beige);
    }
    .tracker li.is-done:not(:first-child)::before, .tracker li.is-current:not(:first-child)::before { background: var(--color-cafe-medio); }
    .tracker__punto {
      position: relative; z-index: 1; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 13px; font-weight: 700; background: var(--color-beige); color: var(--color-gris-oscuro);
    }
    .is-done .tracker__punto { background: var(--color-cafe-claro); color: white; }
    .is-current .tracker__punto { background: var(--color-cafe-medio); color: white; }
    .tracker__label { font-size: 12px; font-weight: 600; color: var(--color-gris-oscuro); text-align: center; }
    .is-current .tracker__label { color: var(--color-cafe-oscuro); }
    .tracker__cancelado { color: var(--color-error); font-weight: 600; margin: 0; }
  `
})
export class PedidoTrackerComponent {
  estado = input.required<EstadoPedidoLinea>();
  tipoEntrega = input.required<TipoEntrega>();

  readonly etiquetas = ETIQUETAS_ESTADO;
  pasos = computed(() => pasosRastreo(this.tipoEntrega()));
  indice = computed(() => this.pasos().indexOf(this.estado()));
}
