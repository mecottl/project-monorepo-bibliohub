import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/libros-listado/libros-listado.page').then(m => m.LibrosListadoPage)
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./pages/libro-form/libro-form.page').then(m => m.LibroFormPage)
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/libro-form/libro-form.page').then(m => m.LibroFormPage)
  },
  {
    path: ':id/movimiento',
    loadComponent: () =>
      import('./pages/movimiento-form/movimiento-form.page').then(m => m.MovimientoFormPage)
  }
];
