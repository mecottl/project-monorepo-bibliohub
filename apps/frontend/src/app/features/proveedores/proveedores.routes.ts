import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';
import { roleGuard } from '@core/auth/role.guard';

export const PROVEEDORES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/proveedores-listado/proveedores-listado.page').then(
            (m) => m.ProveedoresListadoPage,
          ),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/pedidos-compra-listado/pedidos-compra-listado.page').then(
            (m) => m.PedidosCompraListadoPage,
          ),
      },
      {
        path: 'pedidos/nuevo',
        loadComponent: () =>
          import('./pages/pedido-compra-form/pedido-compra-form.page').then(
            (m) => m.PedidoCompraFormPage,
          ),
      },
      {
        path: 'pedidos/:id',
        loadComponent: () =>
          import('./pages/pedido-compra-detalle/pedido-compra-detalle.page').then(
            (m) => m.PedidoCompraDetallePage,
          ),
      },
    ],
  },
];
