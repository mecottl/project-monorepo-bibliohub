import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const CLIENTES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'cajero'] },
    children: [
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
    ]
  }
];
