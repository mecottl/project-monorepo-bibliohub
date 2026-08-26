import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-mis-pedidos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
      <path d="M9 8h6M9 12h6" stroke-linecap="round" />
    </svg>
  `
})
export class MisPedidosIconComponent {}
