import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogoService } from '../catalogo.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { SearchInputComponent } from '../../../shared/search-input/search-input.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { Categoria, Libro } from '../tienda.model';

const LIMIT = 12;

@Component({
  selector: 'app-libros',
  standalone: true,
  imports: [BookCardComponent, SearchInputComponent, PaginationComponent, RouterLink],
  templateUrl: './libros.page.html',
  styleUrl: './libros.page.css'
})
export class LibrosPage {
  private readonly catalogo = inject(CatalogoService);
  private readonly route = inject(ActivatedRoute);

  libros = signal<Libro[]>([]);
  total = signal(0);
  page = signal(1);
  searchTerm = signal('');
  categoriaId = signal<string | null>(null);
  categorias = signal<Categoria[]>([]);
  loading = signal(true);

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / LIMIT)));

  categoriaActual = computed(() => {
    const id = this.categoriaId();
    return id ? (this.categorias().find((c) => c.id === id) ?? null) : null;
  });

  encabezado = computed(() => {
    if (this.searchTerm()) return `Búsquedas relacionadas a "${this.searchTerm()}"`;
    return this.categoriaActual()?.nombre ?? 'Todos los libros';
  });

  constructor() {
    this.catalogo.getCategorias().subscribe((data) => this.categorias.set(data));

    this.route.queryParamMap.subscribe((params) => {
      this.categoriaId.set(params.get('categoriaId'));
      this.page.set(1);
      this.cargar();
    });
  }

  onSearch(valor: string): void {
    this.searchTerm.set(valor);
    this.page.set(1);
    this.cargar();
  }

  onPageChange(nuevaPagina: number): void {
    this.page.set(nuevaPagina);
    this.cargar();
  }

  private cargar(): void {
    this.loading.set(true);
    this.catalogo
      .getLibros({
        titulo: this.searchTerm() || undefined,
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
