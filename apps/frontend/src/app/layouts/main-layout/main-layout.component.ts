import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { LogoComponent } from '../../shared/logo/logo.component';

const RUTAS_SOLO_ADMIN = [
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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  /** Un admin puede "entrar" a la tienda pública sin dejar de ser admin. */
  vistaCliente = signal(false);

  mostrarAdminChrome = computed(() => this.auth.isAdmin() && !this.vistaCliente());

  constructor() {
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe((evento) => {
        if (RUTAS_SOLO_ADMIN.some((ruta) => evento.urlAfterRedirects.startsWith(ruta))) {
          this.vistaCliente.set(false);
        }
      });
  }

  onLogoClick(): void {
    if (!this.auth.isAdmin()) {
      this.router.navigate(['/']);
      return;
    }

    this.vistaCliente.update((valor) => !valor);
    this.router.navigate([this.vistaCliente() ? '/tienda' : '/']);
  }

  onLogout(): void {
    this.auth.logout();
  }
}
