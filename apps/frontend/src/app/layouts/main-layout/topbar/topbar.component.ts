import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CatalogoBusquedaService } from '../../../features/tienda/catalogo-busqueda.service';
import { CarritoService } from '../../../features/tienda/carrito/services/carrito.service';
import { ListaDeseosService } from '../../../features/tienda/lista-deseos/lista-deseos.service';
import { SearchInputComponent } from '../../../shared/search-input/search-input.component';
import { MenuIconComponent } from '../../../shared/icons/menu-icon.component';
import { CarritoIconComponent } from '../../../shared/icons/carrito-icon.component';
import { KodamaAvatarComponent } from '../../../shared/kodama-avatar/kodama-avatar.component';
import { UsuarioIconComponent } from '../../../shared/icons/usuario-icon.component';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, SearchInputComponent, MenuIconComponent, CarritoIconComponent, UsuarioIconComponent, KodamaAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
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
