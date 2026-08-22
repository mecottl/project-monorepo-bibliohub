import { Routes } from '@angular/router';

export const TIENDA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(m => m.HomeComponent)
  }
];
