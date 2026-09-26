import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CambioOrden, DataTableComponent } from '../../../../shared/data-table/data-table.component';
import { DataTableColumn } from '../../../../shared/data-table/data-table.model';
import { StatCardComponent } from '../../../../shared/stat-card/stat-card.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { ConfirmModalComponent } from '../../../../shared/confirm-modal/confirm-modal.component';
import { exportarExcel } from '../../../../shared/excel/excel-export';
import { ReportesTabsComponent } from '../../reportes-tabs.component';
import { ReportesService } from '../../services/reportes.service';
import { VentasService } from '../../../ventas/services/ventas.service';
import { PedidosService } from '../../../tienda/carrito/services/pedidos.service';
import { HistorialVentas, VentaHistorial, DetalleHistorial } from '../../models/historial.model';

const LIMITE = 15;

function iso(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

const ETIQUETA_ESTADO: Record<string, string> = {
  completada: 'Completada',
  en_proceso: 'En proceso',
  cancelada: 'Cancelada'
};

@Component({
  selector: 'app-historial-ventas',
  imports: [
    CurrencyPipe, DatePipe, FormsModule, RouterLink, DataTableComponent, StatCardComponent,
    PaginationComponent, ConfirmModalComponent, ReportesTabsComponent
  ],
  templateUrl: './historial.page.html',
  styleUrl: './historial.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialVentasPage {
  private readonly reportes = inject(ReportesService);
  private readonly ventas = inject(VentasService);
  private readonly pedidos = inject(PedidosService);

  desde = signal(iso(new Date(Date.now() - 29 * 86_400_000)));
  hasta = signal(iso(new Date()));
  canal = signal('');
  estado = signal('');
  busqueda = signal('');
  orden = signal<CambioOrden<VentaHistorial>>({ key: 'fecha', direccion: 'desc' });
  page = signal(1);

  resultado = signal<HistorialVentas | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  seleccionada = signal<VentaHistorial | null>(null);
  detalle = signal<DetalleHistorial | null>(null);
  cargandoDetalle = signal(false);
  confirmandoCancelar = signal(false);
  mensajeDetalle = signal<string | null>(null);

  private temporizador?: ReturnType<typeof setTimeout>;

  readonly columnas: DataTableColumn<VentaHistorial>[] = [
    { key: 'fecha', label: 'Fecha', formatter: (v) => new Date(String(v)).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) },
    { key: 'id', label: 'Folio', sortable: false, formatter: (v) => String(v).slice(0, 8).toUpperCase() },
    { key: 'canal', label: 'Canal', sortable: false, formatter: (v) => (v === 'tienda' ? 'Tienda' : 'En línea') },
    { key: 'clienteNombre', label: 'Cliente', sortable: false, formatter: (_v, f) => f.clienteNombre || f.clienteTelefono || 'Mostrador' },
    { key: 'empleado', label: 'Empleado', sortable: false, formatter: (v) => (v ? String(v) : '—') },
    { key: 'medioPago', label: 'Pago', sortable: false, formatter: (v) => (v === 'efectivo' ? 'Efectivo' : 'Tarjeta') },
    { key: 'unidades', label: 'Unid.', align: 'right', sortable: false },
    { key: 'total', label: 'Total', align: 'right', formatter: (v) => `$${Number(v).toFixed(2)}` },
    {
      key: 'estadoGrupo', label: 'Estado', sortable: false,
      formatter: (v) => ETIQUETA_ESTADO[String(v)] ?? String(v),
      cellClass: (v) => (v === 'cancelada' ? 'cell-danger' : '')
    }
  ];

  readonly etiquetaEstado = (g: string) => ETIQUETA_ESTADO[g] ?? g;

  puedeCancelar = computed(() => {
    const v = this.seleccionada();
    return !!v && v.canal === 'tienda' && v.estadoGrupo === 'completada';
  });

  constructor() {
    this.cargar();
  }

  private parametros(limit: number, page: number) {
    const o = this.orden();
    return {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
      canal: this.canal() || undefined,
      estado: this.estado() || undefined,
      busqueda: this.busqueda().trim() || undefined,
      orden: o.key === 'total' ? 'total' : 'fecha',
      direccion: o.direccion === 'asc' ? 'ASC' : 'DESC',
      page,
      limit
    };
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.reportes.historialVentas(this.parametros(LIMITE, this.page())).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el historial.');
        this.cargando.set(false);
      }
    });
  }

  // Cualquier cambio de filtro vuelve a la página 1; la búsqueda espera a que se deje de escribir.
  filtrar(cambio: () => void, esperar = false): void {
    cambio();
    this.page.set(1);
    clearTimeout(this.temporizador);
    if (esperar) this.temporizador = setTimeout(() => this.cargar(), 300);
    else this.cargar();
  }

  onOrden(cambio: CambioOrden<VentaHistorial> | null): void {
    this.orden.set(cambio ?? { key: 'fecha', direccion: 'desc' });
    this.page.set(1);
    this.cargar();
  }

  onPagina(pagina: number): void {
    this.page.set(pagina);
    this.cargar();
  }

  limpiar(): void {
    this.filtrar(() => {
      this.desde.set(iso(new Date(Date.now() - 29 * 86_400_000)));
      this.hasta.set(iso(new Date()));
      this.canal.set('');
      this.estado.set('');
      this.busqueda.set('');
    });
  }

  exportar(): void {
    this.reportes.historialVentas(this.parametros(1000, 1)).subscribe((r) => {
      exportarExcel(`historial-ventas_${this.desde()}_${this.hasta()}`, this.columnas, r.data);
    });
  }

  // --- detalle ---

  abrir(venta: VentaHistorial): void {
    this.seleccionada.set(venta);
    this.detalle.set(null);
    this.mensajeDetalle.set(null);
    this.cargandoDetalle.set(true);
    const alTerminar = {
      error: () => {
        this.mensajeDetalle.set('No se pudo cargar el detalle.');
        this.cargandoDetalle.set(false);
      }
    };
    const mostrar = (d: unknown) => {
      this.detalle.set(d as DetalleHistorial);
      this.cargandoDetalle.set(false);
    };
    if (venta.canal === 'tienda') this.ventas.obtener(venta.id).subscribe({ next: mostrar, ...alTerminar });
    else this.pedidos.obtenerPedidoAdmin(venta.id).subscribe({ next: mostrar, ...alTerminar });
  }

  cerrar(): void {
    this.seleccionada.set(null);
    this.detalle.set(null);
    this.confirmandoCancelar.set(false);
  }

  confirmarCancelacion(): void {
    const venta = this.seleccionada();
    if (!venta) return;
    this.confirmandoCancelar.set(false);
    this.ventas.cancelar(venta.id).subscribe({
      next: () => {
        this.mensajeDetalle.set('Venta cancelada: se repuso el stock y se revirtieron los puntos.');
        this.seleccionada.set({ ...venta, estado: 'cancelada', estadoGrupo: 'cancelada' });
        this.cargar();
      },
      error: (err) => this.mensajeDetalle.set(err?.error?.message ?? 'No se pudo cancelar la venta.')
    });
  }
}
