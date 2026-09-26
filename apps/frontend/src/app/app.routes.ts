import { Routes } from '@angular/router';
import { AuthLayoutComponent } from '@layouts/auth-layout/auth-layout.component';
import { landingGuard } from '@core/auth/landing.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [landingGuard],
    loadComponent: () =>
      import('@features/landing/pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('@layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('@features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'inventario',
        loadChildren: () =>
          import('@features/inventario/inventario.routes').then((m) => m.INVENTARIO_ROUTES),
      },
      {
        path: 'ventas',
        loadChildren: () => import('@features/ventas/ventas.routes').then((m) => m.VENTAS_ROUTES),
      },
      {
        path: 'pedidos-en-linea',
        loadChildren: () =>
          import('@features/pedidos-linea/pedidos-linea.routes').then(
            (m) => m.PEDIDOS_LINEA_ROUTES,
          ),
      },
      {
        path: 'clientes',
        loadChildren: () =>
          import('@features/clientes/clientes.routes').then((m) => m.CLIENTES_ROUTES),
      },
      {
        path: 'proveedores',
        loadChildren: () =>
          import('@features/proveedores/proveedores.routes').then((m) => m.PROVEEDORES_ROUTES),
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('@features/reportes/reportes.routes').then((m) => m.REPORTES_ROUTES),
      },
      {
        path: 'configuracion',
        loadChildren: () =>
          import('@features/configuracion/configuracion.routes').then(
            (m) => m.CONFIGURACION_ROUTES,
          ),
      },
      {
        path: 'empleados',
        loadChildren: () =>
          import('@features/empleados/empleados.routes').then((m) => m.EMPLEADOS_ROUTES),
      },
      {
        path: 'cuenta',
        loadChildren: () => import('@features/cuenta/cuenta.routes').then((m) => m.CUENTA_ROUTES),
      },
      {
        path: '',
        loadChildren: () => import('@features/tienda/tienda.routes').then((m) => m.TIENDA_ROUTES),
      },
      {
        path: 'mis-pedidos',
        pathMatch: 'full',
        redirectTo: 'cuenta/compras',
      },
    ],
  },
  {
    path: 'login',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () => import('@features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
