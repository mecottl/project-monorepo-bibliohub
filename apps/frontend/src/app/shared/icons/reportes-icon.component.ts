import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-reportes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-7" stroke-linecap="round" />
      <path d="M2 20h20" stroke-linecap="round" />
    </svg>
  `
})
export class ReportesIconComponent {}
