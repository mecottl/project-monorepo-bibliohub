import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { CatalogoBusquedaService } from '../../../features/tienda/catalogo-busqueda.service';
import { SearchInputComponent } from '../../../shared/search-input/search-input.component';
import { MenuIconComponent } from '../../../shared/icons/menu-icon.component';
import { CarritoIconComponent } from '../../../shared/icons/carrito-icon.component';
import { UsuarioIconComponent } from '../../../shared/icons/usuario-icon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, SearchInputComponent, MenuIconComponent, CarritoIconComponent, UsuarioIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.css'
})
export class TopbarComponent {
  auth = inject(AuthService);
  busqueda = inject(CatalogoBusquedaService);

  mostrarAdminChrome = input.required<boolean>();
  mostrarBusqueda = input(false);
  menuAbierto = input(false);

  menuToggle = output<void>();
  logout = output<void>();
}
