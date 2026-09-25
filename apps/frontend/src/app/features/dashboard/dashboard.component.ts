import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChartConfiguration } from 'chart.js';
import { AuthService } from '../../core/auth/auth.service';
import { StatCardComponent } from '../../shared/stat-card/stat-card.component';
import { DataTableColumn } from '../../shared/data-table/data-table.model';
import { DataTableComponent } from '../../shared/data-table/data-table.component';
import { ChartComponent } from '../../shared/chart/chart.component';
import { ReportesService } from '../reportes/services/reportes.service';
import { LibroMasVendido, VentasPorDia } from '../reportes/models/reporte.model';
import { CatalogoService } from '../inventario/services/catalogo.service';
import { Libro } from '../inventario/models/libro.model';

function haceDiasISO(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, StatCardComponent, DataTableComponent, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  auth = inject(AuthService);
  private readonly reportesService = inject(ReportesService);
  private readonly catalogoService = inject(CatalogoService);

  stockBajo = signal<Libro[]>([]);
  masVendidos = signal<LibroMasVendido[]>([]);
  ventasHoy = signal(0);
  montoHoy = signal(0);
  ventasSemana = signal(0);
  montoSemana = signal(0);
  ventasPorDia = signal<VentasPorDia[]>([]);
  loading = signal(true);

  montoSemanaFormateado = computed(() => `$${this.montoSemana().toFixed(2)}`);
  montoHoyFormateado = computed(() => `$${this.montoHoy().toFixed(2)}`);

  chartVentasSemana = computed<ChartConfiguration>(() => ({
    type: 'line',
    data: {
      labels: this.ventasPorDia().map((v) => v.fecha),
      datasets: [
        {
          label: 'Monto vendido',
          data: this.ventasPorDia().map((v) => Number(v.montoTotal)),
          borderColor: '#9c6b43',
          backgroundColor: 'rgba(156, 107, 67, 0.15)',
          fill: true,
          tension: 0.3
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
  }));

  chartMasVendidos = computed<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: this.masVendidos().map((l) => l.titulo),
      datasets: [
        {
          label: 'Unidades vendidas',
          data: this.masVendidos().map((l) => l.unidadesVendidas),
          backgroundColor: '#9c6b43'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } }
    }
  }));

  columnasStockBajo: DataTableColumn<Libro>[] = [
    { key: 'titulo', label: 'Libro' },
    { key: 'stockActual', label: 'Stock actual', align: 'right' },
    { key: 'stockMinimo', label: 'Stock mínimo', align: 'right' }
  ];

  constructor() {
    this.catalogoService.listarStockBajo().subscribe((data) => this.stockBajo.set(data));

    this.reportesService.librosMasVendidos().subscribe((data) => {
      this.masVendidos.set(data.slice(0, 5));
    });

    const hoy = haceDiasISO(0);
    this.reportesService.ventasPorPeriodo(hoy, hoy).subscribe((data) => {
      this.ventasHoy.set(data.reduce((acc, v) => acc + v.totalVentas, 0));
      this.montoHoy.set(data.reduce((acc, v) => acc + Number(v.montoTotal), 0));
    });

    // Se pide un rango más amplio (30 días) para que la gráfica tenga algo que
    // mostrar aunque no haya ventas en los últimos 7 días — el stat card de
    // "últimos 7 días" se calcula filtrando este mismo resultado, sin otra
    // llamada aparte.
    const desde30 = haceDiasISO(30);
    this.reportesService.ventasPorPeriodo(desde30, hoy).subscribe({
      next: (data) => {
        this.ventasPorDia.set(data);
        const desde7 = haceDiasISO(7);
        const ultimos7 = data.filter((v) => v.fecha >= desde7);
        this.ventasSemana.set(ultimos7.reduce((acc, v) => acc + v.totalVentas, 0));
        this.montoSemana.set(ultimos7.reduce((acc, v) => acc + Number(v.montoTotal), 0));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
