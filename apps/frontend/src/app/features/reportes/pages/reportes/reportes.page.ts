import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataTableColumn } from '@shared/ui/data-table/data-table.model';
import { DataTableComponent } from '@shared/ui/data-table/data-table.component';
import { StatCardComponent } from '@shared/ui/stat-card/stat-card.component';
import { exportarExcel } from '@shared/utils/excel/excel-export';
import { ReportesTabsComponent } from '../../components/reportes-tabs/reportes-tabs.component';
import { ReportesService } from '@domain/reportes/reportes.service';
import { LibroMasVendido, RendimientoEmpleado, VentasPorDia } from '@domain/reportes/reporte.model';

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function haceDiasISO(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-reportes',
  imports: [FormsModule, DataTableComponent, StatCardComponent, ReportesTabsComponent],
  templateUrl: './reportes.page.html',
  styleUrl: './reportes.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesPage {
  private readonly reportesService = inject(ReportesService);

  rendimiento = signal<RendimientoEmpleado[]>([]);
  masVendidos = signal<LibroMasVendido[]>([]);
  ventasPorDia = signal<VentasPorDia[]>([]);
  loading = signal(true);

  fechaDesde = signal(haceDiasISO(30));
  fechaHasta = signal(hoyISO());

  totalVentasPeriodo = computed(() =>
    this.ventasPorDia().reduce((acc, v) => acc + v.totalVentas, 0),
  );
  montoTotalPeriodo = computed(() =>
    this.ventasPorDia().reduce((acc, v) => acc + Number(v.montoTotal), 0),
  );

  columnasRendimiento: DataTableColumn<RendimientoEmpleado>[] = [
    { key: 'nombre', label: 'Empleado' },
    { key: 'rol', label: 'Rol' },
    { key: 'totalVentas', label: 'Ventas', align: 'right' },
    {
      key: 'montoTotal',
      label: 'Monto total',
      align: 'right',
      formatter: (value) => (value ? `$${Number(value).toFixed(2)}` : '—'),
    },
  ];

  columnasMasVendidos: DataTableColumn<LibroMasVendido>[] = [
    { key: 'titulo', label: 'Libro' },
    { key: 'unidadesVendidas', label: 'Unidades', align: 'right' },
    {
      key: 'ingresosGenerados',
      label: 'Ingresos',
      align: 'right',
      formatter: (value) => `$${Number(value).toFixed(2)}`,
    },
  ];

  columnasVentasPorDia: DataTableColumn<VentasPorDia>[] = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'totalVentas', label: 'Ventas', align: 'right' },
    {
      key: 'montoTotal',
      label: 'Monto',
      align: 'right',
      formatter: (value) => `$${Number(value).toFixed(2)}`,
    },
  ];

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.reportesService.rendimientoEmpleados().subscribe((data) => this.rendimiento.set(data));
    this.reportesService.librosMasVendidos().subscribe((data) => this.masVendidos.set(data));
    this.cargarVentasPorPeriodo();
  }

  cargarVentasPorPeriodo(): void {
    this.reportesService.ventasPorPeriodo(this.fechaDesde(), this.fechaHasta()).subscribe({
      next: (data) => {
        this.ventasPorDia.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFechaDesdeChange(valor: string): void {
    this.fechaDesde.set(valor);
    this.cargarVentasPorPeriodo();
  }

  onFechaHastaChange(valor: string): void {
    this.fechaHasta.set(valor);
    this.cargarVentasPorPeriodo();
  }

  exportarVentasPorDia(): void {
    exportarExcel(
      `ventas-por-dia_${this.fechaDesde()}_${this.fechaHasta()}`,
      this.columnasVentasPorDia,
      this.ventasPorDia(),
    );
  }

  exportarRendimiento(): void {
    exportarExcel('rendimiento-empleados', this.columnasRendimiento, this.rendimiento());
  }

  exportarMasVendidos(): void {
    exportarExcel('libros-mas-vendidos', this.columnasMasVendidos, this.masVendidos());
  }
}
