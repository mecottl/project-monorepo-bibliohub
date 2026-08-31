import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-clientes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.3 14.2A5 5 0 0 1 21 19" />
    </svg>
  `
})
export class ClientesIconComponent {}
