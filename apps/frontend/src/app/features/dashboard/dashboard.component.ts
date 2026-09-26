import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ChartConfiguration } from 'chart.js';
import { AuthService } from '@core/auth/auth.service';
import { StatCardComponent } from '@shared/stat-card/stat-card.component';
import { DataTableColumn } from '@shared/data-table/data-table.model';
import { DataTableComponent } from '@shared/data-table/data-table.component';
import { ChartComponent } from '@shared/chart/chart.component';
import { COLOR_PRIMARIO, gradienteArea, moneda, monedaCorta } from '@shared/chart/tremor-theme';
import { ReportesService } from '@features/reportes/services/reportes.service';
import { LibroMasVendido, VentasPorDia } from '@features/reportes/models/reporte.model';
import { CatalogoService } from '@features/inventario/services/catalogo.service';
import { Libro } from '@features/inventario/models/libro.model';

// Fecha local (no UTC) en formato YYYY-MM-DD, igual que devuelve el backend por día.
function haceDiasISO(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function variacion(actual: number, previo: number): number | null {
  return previo > 0 ? ((actual - previo) / previo) * 100 : null;
}

interface Periodo {
  ventas: number;
  monto: number;
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
  ventasPorDia = signal<VentasPorDia[]>([]);
  loading = signal(true);

  // Últimos 30 días completos (los días sin ventas cuentan como 0) para una serie continua.
  private serie = computed(() => {
    const porFecha = new Map(this.ventasPorDia().map((v) => [v.fecha, v]));
    return Array.from({ length: 30 }, (_, i) => {
      const fecha = haceDiasISO(29 - i);
      const v = porFecha.get(fecha);
      return { fecha, ventas: v?.totalVentas ?? 0, monto: Number(v?.montoTotal ?? 0) };
    });
  });

  // desde/hasta = posiciones de la serie (0 = hace 29 días, 29 = hoy).
  private periodo(desde: number, hasta: number): Periodo {
    return this.serie()
      .slice(desde, hasta + 1)
      .reduce((acc, d) => ({ ventas: acc.ventas + d.ventas, monto: acc.monto + d.monto }), { ventas: 0, monto: 0 });
  }

  hoy = computed(() => this.periodo(29, 29));
  ayer = computed(() => this.periodo(28, 28));
  semana = computed(() => this.periodo(23, 29));
  semanaPrevia = computed(() => this.periodo(16, 22));

  ticketSemana = computed(() => (this.semana().ventas ? this.semana().monto / this.semana().ventas : 0));
  ticketPrevio = computed(() =>
    this.semanaPrevia().ventas ? this.semanaPrevia().monto / this.semanaPrevia().ventas : 0
  );

  deltaHoy = computed(() => variacion(this.hoy().monto, this.ayer().monto));
  deltaSemana = computed(() => variacion(this.semana().monto, this.semanaPrevia().monto));
  deltaTicket = computed(() => variacion(this.ticketSemana(), this.ticketPrevio()));

  moneda = (valor: number) => moneda.format(valor);
  total30 = computed(() => this.serie().reduce((acc, d) => acc + d.monto, 0));

  chartVentas = computed<ChartConfiguration>(() => ({
    type: 'line',
    data: {
      labels: this.serie().map((d) =>
        new Date(`${d.fecha}T00:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
      ),
      datasets: [
        {
          label: 'Ventas',
          data: this.serie().map((d) => d.monto),
          borderColor: COLOR_PRIMARIO,
          backgroundColor: gradienteArea(COLOR_PRIMARIO),
          fill: true,
          cubicInterpolationMode: 'monotone',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: COLOR_PRIMARIO
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { maxTicksLimit: 6, maxRotation: 0 } },
        y: {
          beginAtZero: true,
          border: { display: false },
          ticks: { maxTicksLimit: 5, callback: (valor) => monedaCorta(Number(valor)) }
        }
      },
      plugins: { tooltip: { callbacks: { label: (item) => ` ${moneda.format(Number(item.parsed.y))}` } } }
    }
  }));

  chartMasVendidos = computed<ChartConfiguration>(() => ({
    type: 'bar',
    data: {
      labels: this.masVendidos().map((l) => (l.titulo.length > 26 ? `${l.titulo.slice(0, 25)}…` : l.titulo)),
      datasets: [
        {
          label: 'Unidades',
          data: this.masVendidos().map((l) => l.unidadesVendidas),
          backgroundColor: COLOR_PRIMARIO,
          hoverBackgroundColor: '#7d5433',
          barThickness: 16
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: { beginAtZero: true, border: { display: false }, ticks: { precision: 0, maxTicksLimit: 5 } },
        y: { grid: { display: false }, border: { display: false } }
      }
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

    // Una sola llamada de 30 días alimenta las tarjetas (hoy, 7 días, ticket) y la gráfica.
    this.reportesService.ventasPorPeriodo(haceDiasISO(29), haceDiasISO(0)).subscribe({
      next: (data) => {
        this.ventasPorDia.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
