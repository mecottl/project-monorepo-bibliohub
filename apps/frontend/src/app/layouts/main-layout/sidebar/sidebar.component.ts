import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { ThemeService } from '@core/theme/theme.service';
import { LogoComponent } from '@shared/ui/logo/logo.component';
import { DashboardIconComponent } from '@shared/icons/dashboard-icon.component';
import { InventarioIconComponent } from '@shared/icons/inventario-icon.component';
import { VentasIconComponent } from '@shared/icons/ventas-icon.component';
import { ClientesIconComponent } from '@shared/icons/clientes-icon.component';
import { ProveedoresIconComponent } from '@shared/icons/proveedores-icon.component';
import { ReportesIconComponent } from '@shared/icons/reportes-icon.component';
import { ConfiguracionIconComponent } from '@shared/icons/configuracion-icon.component';
import { InicioIconComponent } from '@shared/icons/inicio-icon.component';
import { CategoriasIconComponent } from '@shared/icons/categorias-icon.component';
import { ListaDeseosIconComponent } from '@shared/icons/lista-deseos-icon.component';
import { MisPedidosIconComponent } from '@shared/icons/mis-pedidos-icon.component';
import { CarritoIconComponent } from '@shared/icons/carrito-icon.component';
import { UsuarioIconComponent } from '@shared/icons/usuario-icon.component';
import { VolverIconComponent } from '@shared/icons/volver-icon.component';
import { LogoutIconComponent } from '@shared/icons/logout-icon.component';

@Component({
  selector: 'app-sidebar',
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
    UsuarioIconComponent,
    CarritoIconComponent,
    LogoutIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  auth = inject(AuthService);
  tema = inject(ThemeService);

  mostrarAdminChrome = input.required<boolean>();
  readonly enlacesCuenta = [
    { ruta: '/cuenta/perfil', texto: 'Perfil', icono: 'usuario' },
    { ruta: '/cuenta/seguridad', texto: 'Correo y contraseña', icono: 'configuracion' },
    { ruta: '/cuenta/direcciones', texto: 'Direcciones', icono: 'inicio' },
    { ruta: '/cuenta/tarjetas', texto: 'Facturación', icono: 'ventas' },
    { ruta: '/cuenta/compras', texto: 'Compras y rastreo', icono: 'pedidos' },
    { ruta: '/cuenta/puntos', texto: 'Mis puntos', icono: 'puntos' },
  ];

  modoCuenta = input(false);
  abierto = input(false);

  brandClick = output<void>();
  logout = output<void>();
}
