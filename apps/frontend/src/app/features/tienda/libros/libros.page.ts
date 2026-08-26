import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogoService } from '../catalogo.service';
import { CatalogoBusquedaService } from '../catalogo-busqueda.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { Categoria, Libro } from '../tienda.model';

const LIMIT = 12;

@Component({
  selector: 'app-libros',
  standalone: true,
  imports: [BookCardComponent, PaginationComponent, RouterLink],
  templateUrl: './libros.page.html',
  styleUrl: './libros.page.css'
})
export class LibrosPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly route = inject(ActivatedRoute);
  busqueda = inject(CatalogoBusquedaService);

  libros = signal<Libro[]>([]);
  total = signal(0);
  page = signal(1);
  categoriaId = signal<string | null>(null);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / LIMIT)));

  categoriaActual = computed(() => {
    const id = this.categoriaId();
    return id ? (this.categorias().find((c) => c.id === id) ?? null) : null;
  });

  encabezado = computed(() => {
    if (this.busqueda.termino()) return `Búsquedas relacionadas a "${this.busqueda.termino()}"`;
    return this.categoriaActual()?.nombre ?? 'Todos los libros';
  });

  constructor() {
    this.catalogo.getCategorias().subscribe((data) => this.categorias.set(data));

    this.route.queryParamMap.subscribe((params) => {
      this.categoriaId.set(params.get('categoriaId'));
    });

    effect(() => {
      this.categoriaId();
      this.busqueda.termino();
      untracked(() => {
        this.page.set(1);
        this.cargar();
      });
    });
  }

  onPageChange(nuevaPagina: number): void {
    this.page.set(nuevaPagina);
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.catalogo
      .getLibros({
        titulo: this.busqueda.termino() || undefined,
        categoriaId: this.categoriaId() ?? undefined,
        page: this.page(),
        limit: LIMIT
      })
      .subscribe({
        next: (res) => {
          this.libros.set(res.data);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }
}
