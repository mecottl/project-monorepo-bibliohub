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
    path: 'reset-password',
    loadComponent: () =>
      import('./reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'recuperar-password',
    loadComponent: () =>
      import('./recuperar-password/recuperar-password.component').then(
        m => m.RecuperarPasswordComponent
      )
  }
];
