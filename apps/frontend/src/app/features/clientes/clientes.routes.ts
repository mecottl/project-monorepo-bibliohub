import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/clientes-listado/clientes-listado.page').then(m => m.ClientesListadoPage)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/cliente-detalle/cliente-detalle.page').then(m => m.ClienteDetallePage)
  }
];
