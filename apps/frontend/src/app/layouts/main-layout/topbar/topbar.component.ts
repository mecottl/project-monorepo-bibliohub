import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { CatalogoBusquedaService } from '@domain/catalogo/catalogo-busqueda.service';
import { CarritoService } from '@domain/carrito/carrito.service';
import { ListaDeseosService } from '@domain/lista-deseos/lista-deseos.service';
import { SearchInputComponent } from '@shared/ui/search-input/search-input.component';
import { MenuIconComponent } from '@shared/icons/menu-icon.component';
import { CarritoIconComponent } from '@shared/icons/carrito-icon.component';
import { KodamaAvatarComponent } from '@shared/ui/kodama-avatar/kodama-avatar.component';
import { UsuarioIconComponent } from '@shared/icons/usuario-icon.component';
import { ThemeToggleComponent } from '@shared/ui/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-topbar',
  imports: [
    RouterLink,
    SearchInputComponent,
    MenuIconComponent,
    CarritoIconComponent,
    UsuarioIconComponent,
    KodamaAvatarComponent,
    ThemeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css',
})
export class TopbarComponent {
  auth = inject(AuthService);
  busqueda = inject(CatalogoBusquedaService);
  carritoService = inject(CarritoService);
  private readonly deseos = inject(ListaDeseosService);

  mostrarAdminChrome = input.required<boolean>();
  mostrarBusqueda = input(false);
  menuAbierto = input(false);

  menuToggle = output<void>();
  logout = output<void>();

  constructor() {
    this.carritoService.cargar();
    this.deseos.cargarIds();
  }
}
