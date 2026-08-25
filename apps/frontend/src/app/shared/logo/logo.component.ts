import { Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `<img class="logo-img" src="/logo.png" alt="BiblioHub" />`,
  styleUrl: './logo.component.css'
})
export class LogoComponent {}
