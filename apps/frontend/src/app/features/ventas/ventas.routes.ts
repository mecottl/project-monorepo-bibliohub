import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const VENTAS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'cajero'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/pos/pos.page').then((m) => m.PosPage),
      },
    ],
  },
];
