import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-proveedores',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="1.5" y="7" width="13" height="10" rx="1.5" />
      <path d="M14.5 10h4l3 3v4h-7z" />
      <circle cx="6.5" cy="19" r="1.8" />
      <circle cx="17.5" cy="19" r="1.8" />
    </svg>
  `
})
export class ProveedoresIconComponent {}
