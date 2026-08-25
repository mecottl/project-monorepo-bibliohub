import { Component, computed, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Libro } from '../tienda.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CurrencyPipe],
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
