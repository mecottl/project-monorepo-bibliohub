import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles: string[] = route.data['roles'] ?? [];

  const user = auth.currentUser();
  if (!user || !roles.includes(user.rol ?? '')) {
    router.navigate(['/inicio']);
    return false;
  }
  return true;
};