import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

const RUTAS_ADMIN = [
  '/dashboard',
  '/inventario',
  '/ventas',
  '/clientes',
  '/proveedores',
  '/reportes',
  '/configuracion'
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  private urlActual = signal(this.router.url);

  /** El chrome (sidebar/topbar) se deriva de la ruta actual, no de un toggle manual. */
  private enRutaAdmin = computed(() => RUTAS_ADMIN.some((ruta) => this.urlActual().startsWith(ruta)));

  mostrarAdminChrome = computed(() => this.auth.isAdmin() && this.enRutaAdmin());
  vistaCliente = computed(() => this.auth.isAdmin() && !this.enRutaAdmin());

  constructor() {
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe((evento) => this.urlActual.set(evento.urlAfterRedirects));
  }

  onLogoClick(): void {
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/inicio']);
      return;
    }

    this.router.navigate([this.mostrarAdminChrome() ? '/inicio' : '/dashboard']);
  }

  onLogout(): void {
    this.auth.logout();
  }
}
