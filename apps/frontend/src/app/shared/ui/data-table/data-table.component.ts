import { ChangeDetectionStrategy, Component, TemplateRef, computed, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DataTableColumn } from '@shared/ui/data-table/data-table.model';

export type DireccionOrden = 'asc' | 'desc';

export interface CambioOrden<T> {
  key: keyof T;
  direccion: DireccionOrden;
}

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

@Component({
  selector: 'app-data-table',
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T extends object> {
  columns = input.required<DataTableColumn<T>[]>();
  data = input<T[]>([]);
  loading = input(false);
  trackByKey = input<keyof T | null>(null);
  rowActionsTemplate = input<TemplateRef<{ $implicit: T }> | null>(null);
  /** false = el padre ordena (p. ej. tablas paginadas en el servidor) y solo escucha `sortChange`. */
  sortLocal = input(true);

  rowClick = output<T>();
  /** Emite el orden elegido; `null` cuando se quita el orden (tercer clic). */
  sortChange = output<CambioOrden<T> | null>();

  orden = signal<CambioOrden<T> | null>(null);

  hasData = computed(() => this.data().length > 0);

  filas = computed(() => {
    const orden = this.orden();
    if (!orden || !this.sortLocal()) return this.data();

    const columna = this.columns().find((c) => c.key === orden.key);
    if (!columna) return this.data();
    const signo = orden.direccion === 'asc' ? 1 : -1;

    // Copia: nunca se muta el arreglo que llega del padre. Los vacíos van siempre al final.
    return [...this.data()].sort((a, b) => {
      const va = this.valorOrden(a, columna);
      const vb = this.valorOrden(b, columna);
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * signo;
      return collator.compare(String(va), String(vb)) * signo;
    });
  });

  private imagenesFallidas = signal<Set<unknown>>(new Set());

  esOrdenable(column: DataTableColumn<T>): boolean {
    return column.sortable !== false && !column.image;
  }

  direccionDe(column: DataTableColumn<T>): DireccionOrden | null {
    const orden = this.orden();
    return orden && orden.key === column.key ? orden.direccion : null;
  }

  ariaSort(column: DataTableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!this.esOrdenable(column)) return null;
    const direccion = this.direccionDe(column);
    return direccion === 'asc' ? 'ascending' : direccion === 'desc' ? 'descending' : 'none';
  }

  /** Ciclo por columna: ascendente → descendente → sin orden. */
  ordenarPor(column: DataTableColumn<T>): void {
    if (!this.esOrdenable(column)) return;
    const actual = this.direccionDe(column);
    const siguiente: DireccionOrden | null = actual === null ? 'asc' : actual === 'asc' ? 'desc' : null;
    const cambio: CambioOrden<T> | null = siguiente ? { key: column.key, direccion: siguiente } : null;
    this.orden.set(cambio);
    this.sortChange.emit(cambio);
  }

  private valorOrden(row: T, column: DataTableColumn<T>): string | number | null {
    let valor: unknown = column.sortValue ? column.sortValue(row) : row[column.key];
    if (valor === null || valor === undefined || valor === '') return null;
    // Objetos/arreglos (p. ej. autores) se ordenan por el texto que se muestra.
    if (typeof valor === 'object') valor = this.cellValue(row, column);
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'boolean') return valor ? 1 : 0;
    const texto = String(valor);
    // Números que llegan como texto (numeric de Postgres) se comparan como números.
    return texto !== '' && !Number.isNaN(Number(texto)) && /^-?\d+(\.\d+)?$/.test(texto) ? Number(texto) : texto;
  }

  cellValue(row: T, column: DataTableColumn<T>): string {
    const raw = row[column.key];
    if (column.formatter) {
      return column.formatter(raw, row);
    }
    return raw === null || raw === undefined ? '—' : String(raw);
  }

  cellClass(row: T, column: DataTableColumn<T>): string {
    return column.cellClass ? column.cellClass(row[column.key], row) : '';
  }

  imagenSrc(row: T, column: DataTableColumn<T>): string | null {
    const raw = row[column.key];
    return typeof raw === 'string' && raw ? raw : null;
  }

  imagenFallida(row: T): boolean {
    return this.imagenesFallidas().has(this.trackRow(0, row));
  }

  onImagenError(row: T): void {
    this.imagenesFallidas.update((actuales) => new Set(actuales).add(this.trackRow(0, row)));
  }

  trackRow = (_index: number, row: T): unknown => {
    const key = this.trackByKey();
    return key ? row[key] : row;
  };

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
}
