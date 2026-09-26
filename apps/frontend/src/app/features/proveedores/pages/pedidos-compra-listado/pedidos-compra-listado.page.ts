import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataTableColumn } from '@shared/data-table/data-table.model';
import { DataTableComponent } from '@shared/data-table/data-table.component';
import { EmptyStateComponent } from '@shared/empty-state/empty-state.component';
import { ProveedoresService } from '../../services/proveedores.service';
import { EstadoPedidoCompra, PedidoCompra } from '../../models/pedido-compra.model';

@Component({
  selector: 'app-pedidos-compra-listado',
  imports: [RouterLink, DataTableComponent, EmptyStateComponent],
  templateUrl: './pedidos-compra-listado.page.html',
  styleUrl: './pedidos-compra-listado.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidosCompraListadoPage {
  private readonly proveedoresService = inject(ProveedoresService);
  private readonly router = inject(Router);

  pedidos = signal<PedidoCompra[]>([]);
  loading = signal(true);

  private readonly etiquetasEstado: Record<EstadoPedidoCompra, string> = {
    pendiente: 'Pendiente',
    enviado: 'Enviado',
    recibido_parcial: 'Recibido parcial',
    recibido: 'Recibido',
    cancelado: 'Cancelado'
  };

  columnas: DataTableColumn<PedidoCompra>[] = [
    {
      key: 'proveedor',
      label: 'Proveedor',
      formatter: (value) => (value as PedidoCompra['proveedor'])?.nombre ?? '—'
    },
    {
      key: 'fecha',
      label: 'Fecha',
      formatter: (value) => new Date(value as string).toLocaleDateString('es-MX')
    },
    {
      key: 'estado',
      label: 'Estado',
      formatter: (value) => this.etiquetasEstado[value as EstadoPedidoCompra] ?? String(value)
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      formatter: (value) => `$${Number(value).toFixed(2)}`
    }
  ];

  constructor() {
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.proveedoresService.listarPedidos({}).subscribe({
      next: (res) => {
        this.pedidos.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  irADetalle(pedido: PedidoCompra): void {
    this.router.navigate(['/proveedores/pedidos', pedido.id]);
  }
}
