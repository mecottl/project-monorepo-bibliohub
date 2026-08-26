import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  `
})
export class DashboardIconComponent {}
