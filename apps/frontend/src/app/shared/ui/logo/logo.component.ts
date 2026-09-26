import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `<img class="logo-img" src="/logo.png" alt="BiblioHub" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './logo.component.css'
})
export class LogoComponent {}
