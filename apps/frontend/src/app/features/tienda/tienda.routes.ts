import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/auth.guard';

export const TIENDA_ROUTES: Routes = [
  {
    path: 'categorias',
    loadComponent: () => import('./pages/libros/libros.page').then((m) => m.LibrosPage),
  },
  { path: 'inicio', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
  {
    path: 'libro/:id',
    loadComponent: () =>
      import('./pages/libro-detalle/libro-detalle.page').then((m) => m.LibroDetallePage),
  },
  {
    path: 'lista-deseos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/lista-deseos/lista-deseos.page').then((m) => m.ListaDeseosPage),
  },
  {
    path: 'carrito',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/carrito-checkout/carrito-checkout.page').then((m) => m.CarritoCheckoutPage),
  },
  {
    path: 'carrito/confirmacion',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/pedido-confirmado/pedido-confirmado.page').then(
        (m) => m.PedidoConfirmadoPage,
      ),
  },
];
