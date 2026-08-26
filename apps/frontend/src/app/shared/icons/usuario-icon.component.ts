import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-usuario',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" fill="currentColor" />
    </svg>
  `
})
export class UsuarioIconComponent {}
