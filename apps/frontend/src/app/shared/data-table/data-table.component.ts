import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DataTableColumn } from './data-table.model';

@Component({
  selector: 'app-data-table',
  imports: [],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent<T extends Record<string, unknown>> {
  columns = input.required<DataTableColumn<T>[]>();
  data = input<T[]>([]);
  loading = input(false);
  trackByKey = input<keyof T | null>(null);

  rowClick = output<T>();

  hasData = computed(() => this.data().length > 0);

  cellValue(row: T, column: DataTableColumn<T>): string {
    const raw = row[column.key];
    if (column.formatter) {
      return column.formatter(raw, row);
    }
    return raw === null || raw === undefined ? '—' : String(raw);
  }

  trackRow = (_index: number, row: T): unknown => {
    const key = this.trackByKey();
    return key ? row[key] : row;
  };

  onRowClick(row: T): void {
    this.rowClick.emit(row);
  }
}
