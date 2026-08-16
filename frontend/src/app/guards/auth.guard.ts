import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/** Waits for the initial session check (cached token → /auth/me) to settle before deciding. */
function whenReady() {
  const auth = inject(AuthService);
  return toObservable(auth.initializing).pipe(
    filter(initializing => !initializing),
    take(1)
  );
}

/** Any logged-in user (customer account area). */
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return whenReady().pipe(
    map(() =>
      auth.isLoggedIn() ? true : router.createUrlTree(['/account/login'], { queryParams: { redirect: state.url } })
    )
  );
};

/** ADMIN or SUPER_ADMIN only (admin panel). */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return whenReady().pipe(map(() => (auth.isLoggedIn() && auth.isAdmin() ? true : router.createUrlTree(['/admin/login']))));
};

/** Redirects an already-authenticated user away from login/register pages. */
export const guestOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return whenReady().pipe(map(() => (auth.isLoggedIn() ? router.createUrlTree(['/account']) : true)));
};

/** Redirects an already-authenticated admin away from the admin login page. */
export const adminGuestOnlyGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return whenReady().pipe(
    map(() => (auth.isLoggedIn() && auth.isAdmin() ? router.createUrlTree(['/admin/dashboard']) : true))
  );
};
