import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  `
})
export class MenuIconComponent {}
