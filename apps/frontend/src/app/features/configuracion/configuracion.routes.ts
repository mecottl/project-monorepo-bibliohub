import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const CONFIGURACION_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'cajero'] },
    loadComponent: () =>
      import('./pages/configuracion/configuracion.page').then((m) => m.ConfiguracionPage),
  },
];
