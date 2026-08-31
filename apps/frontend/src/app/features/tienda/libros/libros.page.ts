import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CatalogoService } from '../catalogo.service';
import { CatalogoBusquedaService } from '../catalogo-busqueda.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { PaginationComponent } from '../../../shared/pagination/pagination.component';
import { Categoria, Libro } from '../tienda.model';

const LIMIT = 12;
const EXTENSIONES_COVER = ['jpg', 'jpeg', 'png'];

function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Component({
  selector: 'app-libros',
  imports: [BookCardComponent, PaginationComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  private coversFallidas = signal<Set<string>>(new Set());
  private coversIntento = signal<Map<string, number>>(new Map());

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / LIMIT)));

  categoriaActual = computed(() => {
    const id = this.categoriaId();
    return id ? (this.categorias().find((c) => c.id === id) ?? null) : null;
  });

  mostrarCategorias = computed(() => !this.categoriaId() && !this.busqueda.termino());

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

  coverSrc(categoria: Categoria): string {
    const intento = this.coversIntento().get(categoria.id) ?? 0;
    const extension = EXTENSIONES_COVER[intento];
    return `/covers/categorias/${slugificar(categoria.nombre)}.${extension}`;
  }

  coverFallida(categoria: Categoria): boolean {
    return this.coversFallidas().has(categoria.id);
  }

  onCoverError(categoria: Categoria): void {
    const intentoActual = this.coversIntento().get(categoria.id) ?? 0;
    const siguienteIntento = intentoActual + 1;

    if (siguienteIntento < EXTENSIONES_COVER.length) {
      this.coversIntento.update((actuales) => new Map(actuales).set(categoria.id, siguienteIntento));
      return;
    }

    this.coversFallidas.update((actuales) => new Set(actuales).add(categoria.id));
  }

  private cargar(): void {
    if (this.mostrarCategorias()) {
      this.loading.set(false);
      return;
    }

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
