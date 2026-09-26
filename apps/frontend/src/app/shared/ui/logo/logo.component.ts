import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `<img
    class="logo-img"
    [src]="sobreOscuro() ? '/logo_blanco.png' : '/logo.png'"
    [alt]="decorativo() ? '' : 'BiblioHub'"
  />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './logo.component.css',
})
export class LogoComponent {
  /** true cuando el nombre "BiblioHub" ya aparece como texto al lado (evita alt redundante). */
  decorativo = input(false);
  /** Usa la versión blanca del logo (fondos oscuros). */
  sobreOscuro = input(false);
}
