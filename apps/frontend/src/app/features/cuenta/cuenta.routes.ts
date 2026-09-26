import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const CUENTA_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'perfil' },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'seguridad',
        loadComponent: () => import('./pages/seguridad.page').then((m) => m.SeguridadPage),
      },
      {
        path: 'direcciones',
        loadComponent: () => import('./pages/direcciones.page').then((m) => m.DireccionesPage),
      },
      {
        path: 'tarjetas',
        loadComponent: () => import('./pages/tarjetas.page').then((m) => m.TarjetasPage),
      },
      {
        path: 'compras',
        loadComponent: () => import('./pages/compras.page').then((m) => m.ComprasPage),
      },
      {
        path: 'compras/tienda/:id',
        data: { origen: 'tienda' },
        loadComponent: () => import('./pages/compra-detalle.page').then((m) => m.CompraDetallePage),
      },
      {
        path: 'compras/:id',
        loadComponent: () => import('./pages/compra-detalle.page').then((m) => m.CompraDetallePage),
      },
      {
        path: 'puntos',
        loadComponent: () => import('./pages/puntos.page').then((m) => m.PuntosPage),
      },
      { path: 'rastreo', pathMatch: 'full', redirectTo: 'compras' },
    ],
  },
];
