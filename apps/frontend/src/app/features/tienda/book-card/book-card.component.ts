import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { CarritoService } from '../carrito/services/carrito.service';
import { ListaDeseosService } from '../lista-deseos/lista-deseos.service';
import { Libro } from '../tienda.model';

@Component({
  selector: 'app-book-card',
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css'
})
export class BookCardComponent {
  private readonly auth = inject(AuthService);
  private readonly carritoService = inject(CarritoService);
  private readonly router = inject(Router);
  readonly deseos = inject(ListaDeseosService);

  libro = input.required<Libro>();

  agregado = signal(false);

  autores = computed(() =>
    (this.libro().libroAutores ?? [])
      .map((relacion) => relacion.autor?.nombre)
      .filter((nombre): nombre is string => !!nombre)
      .join(', ')
  );

  agregarAlCarrito(): void {
    if (!this.auth.isCliente()) {
      this.router.navigate(['/login']);
      return;
    }

    this.carritoService.agregarItem(this.libro().id).subscribe(() => {
      this.agregado.set(true);
      setTimeout(() => this.agregado.set(false), 1500);
    });
  }
}
