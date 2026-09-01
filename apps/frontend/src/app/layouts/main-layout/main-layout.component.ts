import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { CatalogoBusquedaService } from '../../features/tienda/catalogo-busqueda.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

const RUTAS_BUSQUEDA = ['/inicio', '/categorias'];

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
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  private busqueda = inject(CatalogoBusquedaService);

  private urlActual = signal(this.router.url);

  private enRutaAdmin = computed(() => RUTAS_ADMIN.some((ruta) => this.urlActual().startsWith(ruta)));

  mostrarAdminChrome = computed(
    () => (this.auth.isAdmin() || this.auth.isCajero()) && this.enRutaAdmin()
  );
  vistaCliente = computed(() => this.auth.isAdmin() && !this.enRutaAdmin());
  mostrarBusqueda = computed(() => RUTAS_BUSQUEDA.some((ruta) => this.urlActual().startsWith(ruta)));

  menuAbierto = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd))
      .subscribe((evento) => {
        if (!RUTAS_BUSQUEDA.some((ruta) => evento.urlAfterRedirects.startsWith(ruta))) {
          this.busqueda.limpiar();
        }
        this.urlActual.set(evento.urlAfterRedirects);
        this.menuAbierto.set(false);
      });
  }

  onMenuToggle(): void {
    this.menuAbierto.update((valor) => !valor);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  onLogoClick(): void {
    if (this.auth.isCajero()) {
      this.router.navigate(['/ventas']);
      return;
    }
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
