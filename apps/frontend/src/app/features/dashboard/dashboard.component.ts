import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <h1 class="font-display">Dashboard</h1>
      @if (auth.currentUser(); as user) {
        <p>Bienvenido, {{ user.nombre }}</p>
        <p>Rol: {{ user.rol ?? user.tipo }}</p>
      }
    </div>
  `
})
export class DashboardComponent {
  auth = inject(AuthService);
}
