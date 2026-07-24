import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn) {
    return true;
  }
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    return true;
  }
  return router.createUrlTree([
    auth.user()?.role === 'BUYER' ? '/conta' : '/app/dashboard',
  ]);
};

export const buyerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) {
    return router.createUrlTree(['/conta/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
  return auth.user()?.role === 'BUYER'
    ? true
    : router.createUrlTree(['/app/dashboard']);
};

export const producerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user()?.role === 'BUYER'
    ? router.createUrlTree(['/conta'])
    : true;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.user()?.role === 'PLATFORM_ADMIN'
    ? true
    : router.createUrlTree(['/app/dashboard']);
};
