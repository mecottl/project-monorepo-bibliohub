import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-stat-card',
  imports: [RouterLink],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number>();
  hint = input<string | null>(null);
  // Variación porcentual contra el periodo anterior (null = sin dato para comparar).
  delta = input<number | null>(null);
  deltaLabel = input('');
  // Enlace opcional al pie de la tarjeta (p. ej. "Ver libros con stock bajo →").
  linkTexto = input<string | null>(null);
  linkRuta = input<string | null>(null);
  linkParams = input<Record<string, string | number> | null>(null);

  tendencia = computed<'sube' | 'baja' | 'igual' | null>(() => {
    const d = this.delta();
    if (d === null) return null;
    return d > 0 ? 'sube' : d < 0 ? 'baja' : 'igual';
  });
  deltaTexto = computed(() => `${Math.abs(this.delta() ?? 0).toFixed(1)}%`);
}
