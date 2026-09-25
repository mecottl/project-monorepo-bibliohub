import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookCardComponent } from '../book-card/book-card.component';
import { ListaDeseosService } from './lista-deseos.service';
import { Libro } from '../tienda.model';

@Component({
  selector: 'app-lista-deseos',
  imports: [BookCardComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="lista-deseos">
      <h1 class="font-display">Lista de deseos</h1>
      @if (cargando()) {
        <p>Cargando...</p>
      } @else if (libros().length === 0) {
        <p class="lista-deseos__vacia">
          Aún no guardas ningún libro. Toca el corazón en cualquier libro para agregarlo.
          <a routerLink="/inicio">Explorar libros</a>
        </p>
      } @else {
        <div class="lista-deseos__grid">
          @for (libro of libros(); track libro.id) {
            <app-book-card [libro]="libro" />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .lista-deseos { display: flex; flex-direction: column; gap: 20px; }
    .lista-deseos__vacia { color: var(--color-gris-oscuro); }
    .lista-deseos__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 220px)); gap: 24px; }
    @media (max-width: 480px) { .lista-deseos__grid { grid-template-columns: repeat(auto-fill, minmax(140px, 170px)); gap: 16px; } }
  `
})
export class ListaDeseosPage {
  private readonly service = inject(ListaDeseosService);

  libros = signal<Libro[]>([]);
  cargando = signal(true);

  constructor() {
    this.service.cargarIds();
    this.service.listar().subscribe({
      next: (libros) => {
        this.libros.set(libros);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }
}
