import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-ventas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 9h.01M18 15h.01" stroke-linecap="round" />
    </svg>
  `
})
export class VentasIconComponent {}
