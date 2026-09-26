import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const REPORTES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/reportes/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: 'historial',
        loadComponent: () =>
          import('./pages/historial/historial.page').then((m) => m.HistorialVentasPage),
      },
    ],
  },
];
