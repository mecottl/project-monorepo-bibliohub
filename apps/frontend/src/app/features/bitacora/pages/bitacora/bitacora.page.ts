import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent } from '@shared/ui/data-table/data-table.component';
import { DataTableColumn } from '@shared/ui/data-table/data-table.model';
import { PaginationComponent } from '@shared/ui/pagination/pagination.component';
import { exportarExcel } from '@shared/utils/excel/excel-export';
import { BitacoraService } from '@domain/bitacora/bitacora.service';
import {
  BitacoraPaginada,
  ETIQUETAS_ACCION,
  EntradaBitacora,
  FiltrosBitacora,
} from '@domain/bitacora/bitacora.model';

const LIMITE = 20;

function iso(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

const etiqueta = (accion: string) => ETIQUETAS_ACCION[accion] ?? accion;
const resumen = (v: Record<string, unknown> | null) =>
  v
    ? Object.entries(v)
        .map(([k, val]) => `${k}: ${val === null ? '—' : String(val)}`)
        .join(' · ')
    : '';

@Component({
  selector: 'app-bitacora',
  imports: [DatePipe, FormsModule, DataTableComponent, PaginationComponent],
  templateUrl: './bitacora.page.html',
  styleUrl: './bitacora.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BitacoraPage {
  private readonly servicio = inject(BitacoraService);

  readonly etiqueta = etiqueta;
  readonly pares = (v: Record<string, unknown> | null) => (v ? Object.entries(v) : []);

  desde = signal(iso(new Date(Date.now() - 29 * 86_400_000)));
  hasta = signal(iso(new Date()));
  accion = signal('');
  acciones = signal<string[]>([]);
  page = signal(1);

  resultado = signal<BitacoraPaginada | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);
  seleccionada = signal<EntradaBitacora | null>(null);

  readonly columnas: DataTableColumn<EntradaBitacora>[] = [
    {
      key: 'fecha',
      label: 'Fecha',
      sortable: false,
      formatter: (v) =>
        new Date(String(v)).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' }),
    },
    {
      key: 'empleadoNombre',
      label: 'Empleado',
      sortable: false,
      formatter: (v) => (v ? String(v) : 'Sistema'),
    },
    { key: 'accion', label: 'Acción', sortable: false, formatter: (v) => etiqueta(String(v)) },
    {
      key: 'entidadId',
      label: 'Registro',
      sortable: false,
      formatter: (v, f) => `${f.entidad}${v ? ' ' + String(v).slice(0, 8) : ''}`,
    },
    { key: 'antes', label: 'Antes', sortable: false, formatter: (v) => resumen(v as never) },
    { key: 'despues', label: 'Después', sortable: false, formatter: (v) => resumen(v as never) },
    { key: 'ip', label: 'IP', sortable: false, formatter: (v) => (v ? String(v) : '—') },
  ];

  constructor() {
    this.servicio.acciones().subscribe((a) => this.acciones.set(a));
    this.cargar();
  }

  private filtros(limit: number, page: number): FiltrosBitacora {
    return {
      accion: this.accion() || undefined,
      fechaDesde: this.desde() || undefined,
      fechaHasta: this.hasta() || undefined,
      page,
      limit,
    };
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.servicio.listar(this.filtros(LIMITE, this.page())).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la bitácora.');
        this.cargando.set(false);
      },
    });
  }

  filtrar(cambio: () => void): void {
    cambio();
    this.page.set(1);
    this.cargar();
  }

  onPagina(p: number): void {
    this.page.set(p);
    this.cargar();
  }

  exportar(): void {
    this.servicio.listar(this.filtros(1000, 1)).subscribe((r) => {
      exportarExcel(`bitacora_${this.desde()}_${this.hasta()}`, this.columnas, r.data);
    });
  }
}
