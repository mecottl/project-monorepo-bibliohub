import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CatalogoService } from '../catalogo.service';
import { CatalogoBusquedaService } from '../catalogo-busqueda.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { Libro } from '../tienda.model';

// Simulado: toma los primeros N libros hasta que existan registros de ventas reales para ordenar por más vendidos.
const DESTACADOS_LIMIT = 8;
const RESULTADOS_BUSQUEDA_LIMIT = 12;
const TODOS_LIBROS_LIMIT = 12;

@Component({
  selector: 'app-tienda-home',
  standalone: true,
  imports: [BookCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private catalogo = inject(CatalogoService);
  busqueda = inject(CatalogoBusquedaService);

  private sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  libros = signal<Libro[]>([]);
  loadingLibros = signal(true);

  todosLibros = signal<Libro[]>([]);
  todosTotal = signal(0);
  private todosPage = signal(0);
  todosLoading = signal(false);

  encabezado = computed(() =>
    this.busqueda.termino() ? `Búsquedas relacionadas a "${this.busqueda.termino()}"` : 'Destacados'
  );

  todosHayMas = computed(() => this.todosLibros().length < this.todosTotal());

  constructor() {
    effect(() => this.cargarLibros(this.busqueda.termino() || undefined));
    this.cargarSiguientePagina();

    effect((onCleanup) => {
      const elemento = this.sentinel()?.nativeElement;
      if (!elemento) return;

      const observer = new IntersectionObserver((entradas) => {
        if (entradas[0].isIntersecting) {
          this.cargarSiguientePagina();
        }
      });
      observer.observe(elemento);
      onCleanup(() => observer.disconnect());
    });
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

  private cargarSiguientePagina(): void {
    if (this.todosLoading() || (this.todosPage() > 0 && !this.todosHayMas())) return;

    this.todosLoading.set(true);
    const siguiente = this.todosPage() + 1;
    this.catalogo.getLibros({ page: siguiente, limit: TODOS_LIBROS_LIMIT }).subscribe({
      next: (respuesta) => {
        this.todosPage.set(siguiente);
        this.todosLibros.update((actuales) => [...actuales, ...respuesta.data]);
        this.todosTotal.set(respuesta.total);
        this.todosLoading.set(false);
      },
      error: () => this.todosLoading.set(false)
    });
  }
}
