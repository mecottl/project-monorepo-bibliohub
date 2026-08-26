import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { LogoComponent } from '../../../shared/logo/logo.component';
import { DashboardIconComponent } from '../../../shared/icons/dashboard-icon.component';
import { InventarioIconComponent } from '../../../shared/icons/inventario-icon.component';
import { VentasIconComponent } from '../../../shared/icons/ventas-icon.component';
import { ClientesIconComponent } from '../../../shared/icons/clientes-icon.component';
import { ProveedoresIconComponent } from '../../../shared/icons/proveedores-icon.component';
import { ReportesIconComponent } from '../../../shared/icons/reportes-icon.component';
import { ConfiguracionIconComponent } from '../../../shared/icons/configuracion-icon.component';
import { InicioIconComponent } from '../../../shared/icons/inicio-icon.component';
import { CategoriasIconComponent } from '../../../shared/icons/categorias-icon.component';
import { ListaDeseosIconComponent } from '../../../shared/icons/lista-deseos-icon.component';
import { MisPedidosIconComponent } from '../../../shared/icons/mis-pedidos-icon.component';
import { VolverIconComponent } from '../../../shared/icons/volver-icon.component';
import { LogoutIconComponent } from '../../../shared/icons/logout-icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LogoComponent,
    DashboardIconComponent,
    InventarioIconComponent,
    VentasIconComponent,
    ClientesIconComponent,
    ProveedoresIconComponent,
    ReportesIconComponent,
    ConfiguracionIconComponent,
    InicioIconComponent,
    CategoriasIconComponent,
    ListaDeseosIconComponent,
    MisPedidosIconComponent,
    VolverIconComponent,
    LogoutIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  auth = inject(AuthService);

  mostrarAdminChrome = input.required<boolean>();
  abierto = input(false);

  brandClick = output<void>();
  logout = output<void>();
}
