import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'recuperar-password',
    loadComponent: () =>
      import('./recuperar-password/recuperar-password.component').then(
        m => m.RecuperarPasswordComponent
      )
  }
];
