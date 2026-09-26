import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogoService } from '@domain/catalogo/catalogo.service';
import { CatalogoBusquedaService } from '@domain/catalogo/catalogo-busqueda.service';
import { BookCardComponent } from '../../components/book-card/book-card.component';
import { Libro } from '@domain/catalogo/catalogo.model';
import {
  FiltrosCatalogoComponent,
  FiltrosCatalogo,
  SIN_FILTROS,
  filtrosAApi,
  filtrosAUrl,
  filtrosDeUrl,
} from '../../components/filtros-catalogo/filtros-catalogo.component';

// Simulado: toma los primeros N libros hasta que existan registros de ventas reales para ordenar por más vendidos.
const DESTACADOS_LIMIT = 8;
const RESULTADOS_BUSQUEDA_LIMIT = 12;
const TODOS_LIBROS_LIMIT = 12;

@Component({
  selector: 'app-tienda-home',
  imports: [BookCardComponent, FiltrosCatalogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
})
export class HomePage {
  private catalogo = inject(CatalogoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  busqueda = inject(CatalogoBusquedaService);

  private sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  libros = signal<Libro[]>([]);
  loadingLibros = signal(true);

  todosLibros = signal<Libro[]>([]);
  todosTotal = signal(0);
  private todosPage = signal(0);
  todosLoading = signal(false);
  filtros = signal<FiltrosCatalogo>(SIN_FILTROS);

  encabezado = computed(() =>
    this.busqueda.termino()
      ? `Búsquedas relacionadas a "${this.busqueda.termino()}"`
      : 'Destacados',
  );

  todosHayMas = computed(() => this.todosLibros().length < this.todosTotal());

  constructor() {
    effect(() => this.cargarLibros(this.busqueda.termino() || undefined));
    // Los filtros viven en la URL: al cambiar se reinicia la lista y se pide la primera página.
    this.route.queryParamMap.subscribe((params) => {
      this.filtros.set(filtrosDeUrl(params));
      this.todosLibros.set([]);
      this.todosTotal.set(0);
      this.todosPage.set(0);
      this.todosLoading.set(false);
      this.cargarSiguientePagina();
    });

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

  cambiarFiltros(filtros: FiltrosCatalogo): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: filtrosAUrl(filtros),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  limpiarFiltros(): void {
    this.cambiarFiltros(SIN_FILTROS);
  }

  private cargarLibros(titulo?: string): void {
    this.loadingLibros.set(true);
    const limit = titulo ? RESULTADOS_BUSQUEDA_LIMIT : DESTACADOS_LIMIT;
    this.catalogo.buscarLibros({ titulo, limit }).subscribe({
      next: (respuesta) => {
        this.libros.set(respuesta.data);
        this.loadingLibros.set(false);
      },
      error: () => this.loadingLibros.set(false),
    });
  }

  private cargarSiguientePagina(): void {
    if (this.todosLoading() || (this.todosPage() > 0 && !this.todosHayMas())) return;

    this.todosLoading.set(true);
    const siguiente = this.todosPage() + 1;
    const filtros = this.filtros();
    this.catalogo
      .buscarLibros({ ...filtrosAApi(filtros), page: siguiente, limit: TODOS_LIBROS_LIMIT })
      .subscribe({
        next: (respuesta) => {
          // Descarta respuestas de una consulta con filtros anteriores.
          if (filtros !== this.filtros()) return;
          this.todosPage.set(siguiente);
          this.todosLibros.update((actuales) => [...actuales, ...respuesta.data]);
          this.todosTotal.set(respuesta.total);
          this.todosLoading.set(false);
        },
        error: () => this.todosLoading.set(false),
      });
  }
}
