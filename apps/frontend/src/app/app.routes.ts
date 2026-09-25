import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';
import { landingGuard } from './core/auth/landing.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [landingGuard],
    loadComponent: () => import('./features/landing/landing.page').then(m => m.LandingPage)
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(
        m => m.MainLayoutComponent
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio'
      },
      {
        path: 'dashboard',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          )
      },
      {
        path: 'inventario',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'cajero'] },
        loadChildren: () =>
          import('./features/inventario/inventario.routes').then(
            m => m.INVENTARIO_ROUTES
          )
      },
      {
        path: 'ventas',
        canActivate: [authGuard, roleGuard],
        loadChildren: () =>
          import('./features/ventas/ventas.routes').then(
            m => m.VENTAS_ROUTES
          ),
        data: { roles: ['admin', 'cajero'] }
      },
      {
        path: 'pedidos-en-linea',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'cajero'] },
        loadComponent: () =>
          import('./features/pedidos-linea/pedidos-linea.page').then(m => m.PedidosLineaPage)
      },
      {
        path: 'clientes',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin', 'cajero'] },
        loadChildren: () =>
          import('./features/clientes/clientes.routes').then(
            m => m.CLIENTES_ROUTES
          )
      },
      {
        path: 'proveedores',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./features/proveedores/proveedores.routes').then(
            m => m.PROVEEDORES_ROUTES
          )
      },
      {
        path: 'reportes',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () =>
          import('./features/reportes/pages/reportes/reportes.page').then(
            m => m.ReportesPage
          )
      },
      {
        path: 'configuracion',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['admin'] },
        loadComponent: () =>
          import('./features/configuracion/pages/configuracion/configuracion.page').then(
            m => m.ConfiguracionPage
          )
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./features/tienda/libros/libros.page').then(
            m => m.LibrosPage
          )
      },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/tienda/home/home.component').then(
            m => m.HomeComponent
          )
      },
      {
        path: 'libro/:id',
        loadComponent: () =>
          import('./features/tienda/libro-detalle/libro-detalle.page').then(
            m => m.LibroDetallePage
          )
      },
      {
        path: 'lista-deseos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/tienda/lista-deseos/lista-deseos.page').then(
            m => m.ListaDeseosPage
          )
      },
      {
        path: 'mis-pedidos',
        pathMatch: 'full',
        redirectTo: 'cuenta/compras'
      },
      {
        path: 'cuenta',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['cliente'] },
        loadChildren: () => import('./features/cuenta/cuenta.routes').then(m => m.CUENTA_ROUTES)
      },
      {
        path: 'carrito',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/tienda/carrito/pages/carrito-checkout/carrito-checkout.page').then(
            m => m.CarritoCheckoutPage
          )
      },
      {
        path: 'carrito/confirmacion',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/tienda/carrito/pages/pedido-confirmado/pedido-confirmado.page').then(
            m => m.PedidoConfirmadoPage
          )
      }
    ]
  },
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
