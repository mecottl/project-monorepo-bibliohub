import * as XLSX from 'xlsx';
import { DataTableColumn } from '@shared/ui/data-table/data-table.model';

export function exportarExcel<T extends object>(
  nombreArchivo: string,
  columnas: DataTableColumn<T>[],
  data: T[]
): void {
  const filas = data.map((fila) =>
    Object.fromEntries(
      columnas.map((columna) => {
        const crudo = fila[columna.key];
        const valor = columna.formatter ? columna.formatter(crudo, fila) : crudo;
        return [columna.label, valor ?? ''];
      })
    )
  );

  const hoja = XLSX.utils.json_to_sheet(filas);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Datos');

  const archivo = nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`;
  XLSX.writeFile(libro, archivo);
}
