import { ChangeDetectionStrategy, Component, TemplateRef, computed, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DataTableColumn } from './data-table.model';

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

  rowClick = output<T>();

  hasData = computed(() => this.data().length > 0);

  private imagenesFallidas = signal<Set<unknown>>(new Set());

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
