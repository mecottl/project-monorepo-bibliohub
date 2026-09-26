import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { DataTableColumn } from '@shared/ui/data-table/data-table.model';
import { CambioOrden, DataTableComponent } from '@shared/ui/data-table/data-table.component';
import { SearchInputComponent } from '@shared/ui/search-input/search-input.component';
import { PaginationComponent } from '@shared/ui/pagination/pagination.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { ConfirmModalComponent } from '@shared/ui/confirm-modal/confirm-modal.component';
import { CatalogoService } from '@domain/catalogo/catalogo.service';
import { Libro, LibroAutor } from '@domain/catalogo/catalogo.model';

@Component({
  selector: 'app-libros-listado',
  imports: [
    RouterLink,
    DataTableComponent,
    SearchInputComponent,
    PaginationComponent,
    EmptyStateComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './libros-listado.page.html',
  styleUrl: './libros-listado.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibrosListadoPage {
  private readonly catalogoService = inject(CatalogoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  libros = signal<Libro[]>([]);
  total = signal(0);
  page = signal(1);
  readonly limit = 10;
  titulo = signal('');
  loading = signal(false);
  libroAEliminar = signal<Libro | null>(null);
  // Filtro que llega desde el dashboard (?stockBajo=1) y orden elegido en los encabezados (en el servidor).
  soloStockBajo = signal(this.route.snapshot.queryParamMap.get('stockBajo') === '1');
  orden = signal<CambioOrden<Libro> | null>(null);

  columns: DataTableColumn<Libro>[] = [
    { key: 'imagenUrl', label: 'Portada', image: true },
    { key: 'titulo', label: 'Título' },
    { key: 'isbn', label: 'ISBN' },
    {
      key: 'libroAutores',
      label: 'Autor',
      sortable: false,
      formatter: (value) => {
        const autores = (value as LibroAutor[] | undefined) ?? [];
        const nombres = autores
          .map((la) => la.autor?.nombre)
          .filter((nombre): nombre is string => !!nombre);
        return nombres.length ? nombres.join(', ') : '—';
      },
    },
    {
      key: 'stockActual',
      label: 'Stock',
      align: 'right',
      cellClass: (value, row) => (Number(value) <= row.stockMinimo ? 'cell-danger' : ''),
    },
    {
      key: 'precioVenta',
      label: 'Precio',
      align: 'right',
      formatter: (value) => `$${Number(value).toFixed(2)}`,
    },
  ];

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.limit)));

  eliminarMensaje = computed(
    () =>
      `¿Eliminar "${this.libroAEliminar()?.titulo ?? ''}"? Si tiene ventas asociadas, se dará de baja en vez de borrarse.`,
  );

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.catalogoService
      .buscarLibros({
        titulo: this.titulo(),
        stockBajo: this.soloStockBajo() || undefined,
        orden: this.orden()?.key as 'titulo' | 'isbn' | 'stockActual' | 'precioVenta' | undefined,
        direccion: this.orden() ? (this.orden()!.direccion === 'asc' ? 'ASC' : 'DESC') : undefined,
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.libros.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onSearch(valor: string): void {
    this.titulo.set(valor);
    this.page.set(1);
    this.cargar();
  }

  onOrden(cambio: CambioOrden<Libro> | null): void {
    this.orden.set(cambio);
    this.page.set(1);
    this.cargar();
  }

  alternarStockBajo(): void {
    this.soloStockBajo.update((v) => !v);
    this.page.set(1);
    // Se refleja en la URL para poder compartir/recargar la vista filtrada.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { stockBajo: this.soloStockBajo() ? 1 : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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

  onRowClick(libro: Libro): void {
    if (this.auth.isCajero()) {
      this.router.navigate(['/libro', libro.id]);
      return;
    }
    this.irAEditar(libro);
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
