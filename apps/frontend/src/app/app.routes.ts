import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/auth/auth.guard';

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
        loadComponent: () =>
          import('./features/inicio/inicio.component').then(
            m => m.InicioComponent
          )
      },
      {
        path: 'inventario',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Inventario' }
      },
      {
        path: 'ventas',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Ventas' }
      },
      {
        path: 'clientes',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Clientes' }
      },
      {
        path: 'proveedores',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Proveedores' }
      },
      {
        path: 'reportes',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Reportes' }
      },
      {
        path: 'configuracion',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Configuración' }
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./shared/placeholder-page/placeholder-page.component').then(
            m => m.PlaceholderPageComponent
          ),
        data: { titulo: 'Categorías' }
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
