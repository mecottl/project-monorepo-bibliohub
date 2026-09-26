import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'cajero'] },
    children: [
    {
      path: '',
      loadComponent: () =>
        import('./pages/libros-listado/libros-listado.page').then(m => m.LibrosListadoPage)
    },
    {
      path: 'catalogo',
      canActivate: [roleGuard],
      data: { roles: ['admin'] },
      loadComponent: () =>
        import('./pages/catalogo-admin/catalogo-admin.page').then(m => m.CatalogoAdminPage)
    },
    {
      path: 'nuevo',
      canActivate: [roleGuard],
      data: { roles: ['admin'] },
      loadComponent: () =>
        import('./pages/libro-form/libro-form.page').then(m => m.LibroFormPage)
    },
    {
      path: ':id/editar',
      canActivate: [roleGuard],
      data: { roles: ['admin'] },
      loadComponent: () =>
        import('./pages/libro-form/libro-form.page').then(m => m.LibroFormPage)
    },
    {
      path: ':id/movimiento',
      canActivate: [roleGuard],
      data: { roles: ['admin'] },
      loadComponent: () =>
        import('./pages/movimiento-form/movimiento-form.page').then(m => m.MovimientoFormPage)
    }
    ]
  }
];
