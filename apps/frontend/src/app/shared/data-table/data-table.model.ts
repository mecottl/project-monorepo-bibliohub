export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: T[keyof T], row: T) => string;
  cellClass?: (value: T[keyof T], row: T) => string;
}
