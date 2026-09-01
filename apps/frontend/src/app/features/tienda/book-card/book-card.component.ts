import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Libro } from '../tienda.model';

@Component({
  selector: 'app-book-card',
  imports: [CurrencyPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.css'
})
export class BookCardComponent {
  libro = input.required<Libro>();

  autores = computed(() =>
    (this.libro().libroAutores ?? [])
      .map((relacion) => relacion.autor?.nombre)
      .filter((nombre): nombre is string => !!nombre)
      .join(', ')
  );
}
