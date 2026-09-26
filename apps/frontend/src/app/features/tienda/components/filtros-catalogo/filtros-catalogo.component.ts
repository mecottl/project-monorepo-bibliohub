import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Params } from '@angular/router';

export type OrdenCatalogo = 'precio_asc' | 'precio_desc' | 'titulo' | 'novedades';

export interface FiltrosCatalogo {
  orden: OrdenCatalogo | null;
  precioMin: number | null;
  precioMax: number | null;
  disponibles: boolean;
}

export const SIN_FILTROS: FiltrosCatalogo = {
  orden: null,
  precioMin: null,
  precioMax: null,
  disponibles: false,
};

const ORDENES: { valor: OrdenCatalogo; texto: string }[] = [
  { valor: 'novedades', texto: 'Novedades' },
  { valor: 'precio_asc', texto: 'Precio: menor a mayor' },
  { valor: 'precio_desc', texto: 'Precio: mayor a menor' },
  { valor: 'titulo', texto: 'Título (A–Z)' },
];

const numero = (v: string | null): number | null => {
  const n = v === null || v === '' ? NaN : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** Lee los filtros desde los query params de la URL (compartibles). */
export function filtrosDeUrl(params: { get(clave: string): string | null }): FiltrosCatalogo {
  const orden = params.get('orden');
  return {
    orden: ORDENES.some((o) => o.valor === orden) ? (orden as OrdenCatalogo) : null,
    precioMin: numero(params.get('precioMin')),
    precioMax: numero(params.get('precioMax')),
    disponibles: params.get('disponibles') === '1',
  };
}

/** Query params para la URL; los vacíos van en null para que `merge` los quite. */
export function filtrosAUrl(f: FiltrosCatalogo): Params {
  return {
    orden: f.orden,
    precioMin: f.precioMin,
    precioMax: f.precioMax,
    disponibles: f.disponibles ? 1 : null,
    page: null,
  };
}

/** Parámetros del endpoint del catálogo. */
export function filtrosAApi(f: FiltrosCatalogo) {
  const orden =
    f.orden === 'precio_asc'
      ? { orden: 'precioVenta', direccion: 'ASC' }
      : f.orden === 'precio_desc'
        ? { orden: 'precioVenta', direccion: 'DESC' }
        : f.orden === 'titulo'
          ? { orden: 'titulo', direccion: 'ASC' }
          : f.orden === 'novedades'
            ? { orden: 'createdAt', direccion: 'DESC' }
            : {};
  return {
    ...orden,
    precioMin: f.precioMin ?? undefined,
    precioMax: f.precioMax ?? undefined,
    disponibles: f.disponibles || undefined,
  };
}

@Component({
  selector: 'app-filtros-catalogo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filtros" role="group" aria-label="Filtrar y ordenar libros">
      <label class="filtros__campo">
        <span>Ordenar por</span>
        <select (change)="cambiar({ orden: leerOrden($event) })">
          <option value="" [selected]="!valor().orden">Relevancia</option>
          @for (o of ordenes; track o.valor) {
            <option [value]="o.valor" [selected]="valor().orden === o.valor">{{ o.texto }}</option>
          }
        </select>
      </label>

      <div class="filtros__campo filtros__precio">
        <span>Precio</span>
        <div>
          <input
            type="number"
            min="0"
            placeholder="Mín."
            aria-label="Precio mínimo"
            [value]="valor().precioMin ?? ''"
            (change)="cambiar({ precioMin: leerNumero($event) })"
          />
          <span aria-hidden="true">–</span>
          <input
            type="number"
            min="0"
            placeholder="Máx."
            aria-label="Precio máximo"
            [value]="valor().precioMax ?? ''"
            (change)="cambiar({ precioMax: leerNumero($event) })"
          />
        </div>
      </div>

      <label class="filtros__check">
        <input
          type="checkbox"
          [checked]="valor().disponibles"
          (change)="cambiar({ disponibles: leerCheck($event) })"
        />
        Solo disponibles
      </label>

      @if (hayFiltros()) {
        <button type="button" class="filtros__limpiar" (click)="limpiar.emit()">
          Limpiar filtros
        </button>
      }

      @if (total() !== null) {
        <span class="filtros__total" aria-live="polite"
          >{{ total() }} {{ total() === 1 ? 'resultado' : 'resultados' }}</span
        >
      }
    </div>
  `,
  styles: `
    .filtros {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 14px 20px;
      padding: 14px 16px;
      background: var(--color-superficie);
      border: 1px solid var(--color-beige);
      border-radius: var(--border-radius-md);
      font-family: var(--font-ui);
      font-size: 13px;
    }
    .filtros__campo {
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: var(--color-gris-oscuro);
      font-weight: 600;
    }
    .filtros select,
    .filtros input[type='number'] {
      padding: 8px 10px;
      border: 1.5px solid var(--color-beige);
      border-radius: var(--border-radius-sm);
      font: inherit;
      font-weight: 400;
      color: var(--color-negro-suave);
      background: var(--color-superficie);
    }
    .filtros select:focus,
    .filtros input:focus-visible {
      outline: 2px solid var(--color-cafe-medio);
      outline-offset: 1px;
    }
    .filtros__precio > div {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .filtros__precio input {
      width: 84px;
    }
    .filtros__check {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      font-weight: 600;
      color: var(--color-negro-suave);
      cursor: pointer;
    }
    .filtros__limpiar {
      padding: 8px 12px;
      border: none;
      background: none;
      color: var(--color-acento-texto);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }
    .filtros__total {
      margin-left: auto;
      padding-bottom: 8px;
      color: var(--color-gris-oscuro);
    }
    @media (max-width: 560px) {
      .filtros__total {
        margin-left: 0;
        flex-basis: 100%;
      }
    }
  `,
})
export class FiltrosCatalogoComponent {
  valor = input.required<FiltrosCatalogo>();
  total = input<number | null>(null);

  cambio = output<FiltrosCatalogo>();
  limpiar = output<void>();

  readonly ordenes = ORDENES;

  hayFiltros = computed(() => {
    const v = this.valor();
    return v.orden !== null || v.precioMin !== null || v.precioMax !== null || v.disponibles;
  });

  cambiar(parcial: Partial<FiltrosCatalogo>): void {
    this.cambio.emit({ ...this.valor(), ...parcial });
  }

  leerOrden(evento: Event): OrdenCatalogo | null {
    return ((evento.target as HTMLSelectElement).value as OrdenCatalogo) || null;
  }

  leerNumero(evento: Event): number | null {
    return numero((evento.target as HTMLInputElement).value);
  }

  leerCheck(evento: Event): boolean {
    return (evento.target as HTMLInputElement).checked;
  }
}
