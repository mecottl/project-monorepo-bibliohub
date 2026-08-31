import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableColumn } from '../../../../shared/data-table/data-table.model';
import { DataTableComponent } from '../../../../shared/data-table/data-table.component';
import { SearchInputComponent } from '../../../../shared/search-input/search-input.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { ClientesService } from '../../services/clientes.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-clientes-listado',
  imports: [DataTableComponent, SearchInputComponent, PaginationComponent, EmptyStateComponent],
  templateUrl: './clientes-listado.page.html',
  styleUrl: './clientes-listado.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientesListadoPage {
  private readonly clientesService = inject(ClientesService);
  private readonly router = inject(Router);

  clientes = signal<Cliente[]>([]);
  total = signal(0);
  page = signal(1);
  readonly limit = 10;
  busqueda = signal('');
  loading = signal(false);

  columns: DataTableColumn<Cliente>[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'telefono', label: 'Teléfono' },
    {
      key: 'email',
      label: 'Email',
      formatter: (value) => (value as string | null) ?? '—'
    },
    {
      key: 'cuentaActiva',
      label: 'Cuenta',
      formatter: (value) => (value ? 'Activa' : 'Inactiva'),
      cellClass: (value) => (value ? '' : 'cell-danger')
    },
    {
      key: 'puntosSaldo',
      label: 'Puntos',
      align: 'right'
    }
  ];

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.clientesService
      .buscarClientes({ busqueda: this.busqueda(), page: this.page(), limit: this.limit })
      .subscribe({
        next: (res) => {
          this.clientes.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onSearch(valor: string): void {
    this.busqueda.set(valor);
    this.page.set(1);
    this.cargar();
  }

  onPageChange(nuevaPagina: number): void {
    this.page.set(nuevaPagina);
    this.cargar();
  }

  irAFicha(cliente: Cliente): void {
    this.router.navigate(['/clientes', cliente.id]);
  }
}
