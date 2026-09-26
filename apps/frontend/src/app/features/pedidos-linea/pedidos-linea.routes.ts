import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const PEDIDOS_LINEA_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'cajero'] },
    loadComponent: () => import('./pages/pedidos-linea/pedidos-linea.page').then((m) => m.PedidosLineaPage)
  }
];
