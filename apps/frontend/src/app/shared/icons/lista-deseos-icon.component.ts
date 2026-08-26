import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'svg-lista-deseos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './icon.css',
  template: `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 5c-2.5 4.6-9.5 9-9.5 9Z"
      />
    </svg>
  `
})
export class ListaDeseosIconComponent {}
