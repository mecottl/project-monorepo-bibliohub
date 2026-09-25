export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  align?: 'left' | 'center' | 'right';
  /** Renderiza la celda como una miniatura de imagen usando el valor de `key` como URL. */
  image?: boolean;
  formatter?: (value: T[keyof T], row: T) => string;
  /** Ordenable al hacer clic en el encabezado (por defecto sí, salvo columnas de imagen). */
  sortable?: boolean;
  /** Valor por el que se ordena; por defecto el valor de la celda (o su texto formateado si es un objeto). */
  sortValue?: (row: T) => string | number | null | undefined;
  cellClass?: (value: T[keyof T], row: T) => string;
}
