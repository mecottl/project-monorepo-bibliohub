import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { CatalogoService } from '../catalogo.service';
import { Categoria, Libro } from '../tienda.model';

const DESTACADOS_LIMIT = 4;

@Component({
  selector: 'app-tienda-home',
  standalone: true,
  imports: [CurrencyPipe],
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

  private cargarLibros(titulo?: string): void {
    this.loadingLibros.set(true);
    this.catalogo.getLibros({ titulo, limit: DESTACADOS_LIMIT }).subscribe({
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
