import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CatalogoService } from '../catalogo.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { Libro } from '../tienda.model';

@Component({
  selector: 'app-libro-detalle',
  imports: [CurrencyPipe, BookCardComponent, StatusBadgeComponent],
  templateUrl: './libro-detalle.page.html',
  styleUrl: './libro-detalle.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibroDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogoService = inject(CatalogoService);

  libro = signal<Libro | null>(null);
  sugeridos = signal<Libro[]>([]);
  cargando = signal(true);
  noEncontrado = signal(false);

  autores = computed(() =>
    (this.libro()?.libroAutores ?? [])
      .map((relacion) => relacion.autor?.nombre)
      .filter((nombre): nombre is string => !!nombre)
      .join(', ')
  );

  disponible = computed(() => (this.libro()?.stockActual ?? 0) > 0);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) this.cargar(id);
    });
  }

  volver(): void {
    this.router.navigate(['/inicio']);
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.noEncontrado.set(false);
    this.catalogoService.getLibro(id).subscribe({
      next: (libro) => {
        this.libro.set(libro);
        this.cargando.set(false);
        this.cargarSugeridos(libro);
      },
      error: () => {
        this.cargando.set(false);
        this.noEncontrado.set(true);
      }
    });
  }

  private cargarSugeridos(libro: Libro): void {
    const categoriaId = libro.categoria?.id;
    if (!categoriaId) {
      this.sugeridos.set([]);
      return;
    }
    this.catalogoService.getLibros({ categoriaId, limit: 5 }).subscribe((res) => {
      this.sugeridos.set(res.data.filter((l) => l.id !== libro.id).slice(0, 4));
    });
  }
}
