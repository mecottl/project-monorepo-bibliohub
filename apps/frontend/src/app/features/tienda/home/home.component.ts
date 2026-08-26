import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogoService } from '../catalogo.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { Categoria, Libro } from '../tienda.model';

const DESTACADOS_LIMIT = 4;
const RESULTADOS_BUSQUEDA_LIMIT = 12;
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
  selector: 'app-tienda-home',
  standalone: true,
  imports: [BookCardComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  private catalogo = inject(CatalogoService);
  private searchTimeout?: ReturnType<typeof setTimeout>;

  libros = signal<Libro[]>([]);
  categorias = signal<Categoria[]>([]);
  searchTerm = signal('');
  loadingLibros = signal(true);
  private coversFallidas = signal<Set<string>>(new Set());
  private coversIntento = signal<Map<string, number>>(new Map());

  encabezado = computed(() =>
    this.searchTerm() ? `Búsquedas relacionadas a "${this.searchTerm()}"` : 'Destacados'
  );

  constructor() {
    this.cargarLibros();
    this.cargarCategorias();
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(
      () => this.cargarLibros(value || undefined),
      300
    );
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

  private cargarCategorias(): void {
    this.catalogo.getCategorias().subscribe({
      next: (categorias) => this.categorias.set(categorias)
    });
  }
}
