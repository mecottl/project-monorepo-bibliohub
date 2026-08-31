export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'center' | 'right';
  /** Renderiza la celda como una miniatura de imagen usando el valor de `key` como URL. */
  image?: boolean;
  formatter?: (value: T[keyof T], row: T) => string;
  cellClass?: (value: T[keyof T], row: T) => string;
}
