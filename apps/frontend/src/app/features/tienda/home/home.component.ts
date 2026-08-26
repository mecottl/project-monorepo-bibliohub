import { Component, computed, effect, inject, signal } from '@angular/core';
import { CatalogoService } from '../catalogo.service';
import { CatalogoBusquedaService } from '../catalogo-busqueda.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { Libro } from '../tienda.model';

// Simulado: toma los primeros N libros hasta que existan registros de ventas reales para ordenar por más vendidos.
const DESTACADOS_LIMIT = 12;
const RESULTADOS_BUSQUEDA_LIMIT = 12;
const TODOS_LIBROS_LIMIT = 12;

@Component({
  selector: 'app-tienda-home',
  standalone: true,
  imports: [BookCardComponent, PaginationComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private catalogo = inject(CatalogoService);
  busqueda = inject(CatalogoBusquedaService);

  libros = signal<Libro[]>([]);
  loadingLibros = signal(true);

  todosLibros = signal<Libro[]>([]);
  todosTotal = signal(0);
  todosPage = signal(1);
  todosLoading = signal(true);

  encabezado = computed(() =>
    this.busqueda.termino() ? `Búsquedas relacionadas a "${this.busqueda.termino()}"` : 'Destacados'
  );

  todosTotalPages = computed(() => Math.max(1, Math.ceil(this.todosTotal() / TODOS_LIBROS_LIMIT)));

  constructor() {
    effect(() => this.cargarLibros(this.busqueda.termino() || undefined));
    this.cargarTodos();
  }

  onTodosPageChange(nuevaPagina: number): void {
    this.todosPage.set(nuevaPagina);
    this.cargarTodos();
  }

  private cargarLibros(titulo?: string): void {
    this.loadingLibros.set(true);
    const limit = titulo ? RESULTADOS_BUSQUEDA_LIMIT : DESTACADOS_LIMIT;
    this.catalogo.getLibros({ titulo, limit }).subscribe({
      next: (respuesta) => {
        this.libros.set(respuesta.data);
        this.loadingLibros.set(false);
      },
      error: () => this.loadingLibros.set(false)
    });
  }

  private cargarTodos(): void {
    this.todosLoading.set(true);
    this.catalogo.getLibros({ page: this.todosPage(), limit: TODOS_LIBROS_LIMIT }).subscribe({
      next: (respuesta) => {
        this.todosLibros.set(respuesta.data);
        this.todosTotal.set(respuesta.total);
        this.todosLoading.set(false);
      },
      error: () => this.todosLoading.set(false)
    });
  }
}
