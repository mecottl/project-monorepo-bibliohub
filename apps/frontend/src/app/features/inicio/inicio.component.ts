import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { HomeComponent } from '../tienda/home/home.component';
import { DashboardComponent } from '../dashboard/dashboard.component';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [HomeComponent, DashboardComponent],
  template: `
    @if (auth.isAdmin()) {
      <app-dashboard />
    } @else {
      <app-tienda-home />
    }
  `
})
export class InicioComponent {
  auth = inject(AuthService);
}
