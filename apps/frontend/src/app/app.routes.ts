import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
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
        data: { roles: ['admin'] },
        loadChildren: () =>
          import('./features/inventario/inventario.routes').then(
            m => m.INVENTARIO_ROUTES
          )
      },
      {
        path: 'ventas',
        canActivate: [authGuard, roleGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Ventas', roles: ['admin'] }
      },
      {
        path: 'clientes',
        canActivate: [authGuard, roleGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Clientes', roles: ['admin'] }
      },
      {
        path: 'proveedores',
        canActivate: [authGuard, roleGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Proveedores', roles: ['admin'] }
      },
      {
        path: 'reportes',
        canActivate: [authGuard, roleGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Reportes', roles: ['admin'] }
      },
      {
        path: 'configuracion',
        canActivate: [authGuard, roleGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Configuración', roles: ['admin'] }
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
        path: 'lista-deseos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Lista de deseos' }
      },
      {
        path: 'mis-pedidos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Mis pedidos' }
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
