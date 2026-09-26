import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { CatalogoService } from '@domain/catalogo/catalogo.service';
import { BookCardComponent } from '../../components/book-card/book-card.component';
import { StatusBadgeComponent } from '@shared/ui/status-badge/status-badge.component';
import { AuthService } from '@core/auth/auth.service';
import { ListaDeseosService } from '@domain/lista-deseos/lista-deseos.service';
import { CarritoService } from '@domain/carrito/carrito.service';
import { Libro } from '@domain/catalogo/catalogo.model';

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
  private readonly auth = inject(AuthService);
  private readonly carritoService = inject(CarritoService);
  readonly deseos = inject(ListaDeseosService);

  libro = signal<Libro | null>(null);
  sugeridos = signal<Libro[]>([]);
  cargando = signal(true);
  noEncontrado = signal(false);
  agregado = signal(false);

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

  agregarAlCarrito(): void {
    const libro = this.libro();
    if (!libro) return;

    if (!this.auth.isCliente()) {
      this.router.navigate(['/login']);
      return;
    }

    this.carritoService.agregarItem(libro.id).subscribe(() => {
      this.agregado.set(true);
      setTimeout(() => this.agregado.set(false), 1500);
    });
  }

  private cargar(id: string): void {
    this.cargando.set(true);
    this.noEncontrado.set(false);
    this.catalogoService.obtenerLibro(id).subscribe({
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
    this.catalogoService.buscarLibros({ categoriaId, limit: 5 }).subscribe((res) => {
      this.sugeridos.set(res.data.filter((l) => l.id !== libro.id).slice(0, 4));
    });
  }
}
