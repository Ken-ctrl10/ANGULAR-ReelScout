import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Only logged-in users can open the route. Others go to /login,
 * with ?returnUrl so they come back here after logging in.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isLoggedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Logged-in users don't need the login/register pages, so send them home. */
export const guestGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn() ? inject(Router).createUrlTree(['/']) : true;
};
