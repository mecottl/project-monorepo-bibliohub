import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-volver',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4 3 9l5 5" />
      <path d="M3 9h11a5 5 0 0 1 5 5v1" />
    </svg>
  `
})
export class VolverIconComponent {}
