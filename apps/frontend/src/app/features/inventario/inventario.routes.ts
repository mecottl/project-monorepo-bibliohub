import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/libros-listado/libros-listado.page').then(m => m.LibrosListadoPage)
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
];
