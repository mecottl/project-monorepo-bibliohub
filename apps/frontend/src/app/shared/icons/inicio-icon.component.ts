import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 11 12 3l9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  `
})
export class InicioIconComponent {}
