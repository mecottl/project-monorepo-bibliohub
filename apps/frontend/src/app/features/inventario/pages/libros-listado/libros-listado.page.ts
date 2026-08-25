import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableColumn } from '../../../../shared/data-table/data-table.model';
import { DataTableComponent } from '../../../../shared/data-table/data-table.component';
import { SearchInputComponent } from '../../../../shared/search-input/search-input.component';
import { PaginationComponent } from '../../../../shared/pagination/pagination.component';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { ConfirmModalComponent } from '../../../../shared/confirm-modal/confirm-modal.component';
import { CatalogoService } from '../../services/catalogo.service';
import { Libro, LibroAutor } from '../../models/libro.model';

@Component({
  selector: 'app-libros-listado',
  imports: [
    DataTableComponent,
    SearchInputComponent,
    PaginationComponent,
    EmptyStateComponent,
    ConfirmModalComponent
  ],
  templateUrl: './libros-listado.page.html',
  styleUrl: './libros-listado.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibrosListadoPage {
  private readonly catalogoService = inject(CatalogoService);
  private readonly router = inject(Router);

  libros = signal<Libro[]>([]);
  total = signal(0);
  page = signal(1);
  readonly limit = 10;
  titulo = signal('');
  loading = signal(false);
  libroAEliminar = signal<Libro | null>(null);

  columns: DataTableColumn<Libro>[] = [
    { key: 'titulo', label: 'Título' },
    { key: 'isbn', label: 'ISBN' },
    {
      key: 'libroAutores',
      label: 'Autor',
      formatter: (value) => {
        const autores = (value as LibroAutor[] | undefined) ?? [];
        const nombres = autores
          .map((la) => la.autor?.nombre)
          .filter((nombre): nombre is string => !!nombre);
        return nombres.length ? nombres.join(', ') : '—';
      }
    },
    {
      key: 'stockActual',
      label: 'Stock',
      align: 'right',
      cellClass: (value, row) => (Number(value) <= row.stockMinimo ? 'cell-danger' : '')
    },
    {
      key: 'precioVenta',
      label: 'Precio',
      align: 'right',
      formatter: (value) => `$${Number(value).toFixed(2)}`
    }
  ];

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));

  eliminarMensaje = computed(
    () =>
      `¿Eliminar "${this.libroAEliminar()?.titulo ?? ''}"? Si tiene ventas asociadas, se dará de baja en vez de borrarse.`
  );

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.catalogoService
      .buscarLibros({ titulo: this.titulo(), page: this.page(), limit: this.limit })
      .subscribe({
        next: (res) => {
          this.libros.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onSearch(valor: string): void {
    this.titulo.set(valor);
    this.page.set(1);
    this.cargar();
  }

  onPageChange(nuevaPagina: number): void {
    this.page.set(nuevaPagina);
    this.cargar();
  }

  irACrear(): void {
    this.router.navigate(['/inventario/nuevo']);
  }

  irAEditar(libro: Libro): void {
    this.router.navigate(['/inventario', libro.id, 'editar']);
  }

  irAMovimiento(libro: Libro): void {
    this.router.navigate(['/inventario', libro.id, 'movimiento']);
  }

  pedirEliminar(libro: Libro): void {
    this.libroAEliminar.set(libro);
  }

  confirmarEliminar(): void {
    const libro = this.libroAEliminar();
    if (!libro) return;

    this.catalogoService.eliminarLibro(libro.id).subscribe(() => {
      this.libroAEliminar.set(null);
      this.cargar();
    });
  }

  cancelarEliminar(): void {
    this.libroAEliminar.set(null);
  }
}
