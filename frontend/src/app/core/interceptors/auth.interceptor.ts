import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

const AUTH_ENDPOINTS_TO_SKIP_RETRY = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = auth.accessToken();
  const authedReq = token
    ? req.clone({ withCredentials: true, setHeaders: { Authorization: `Bearer ${token}` } })
    : req.clone({ withCredentials: true });

  return next(authedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = AUTH_ENDPOINTS_TO_SKIP_RETRY.some(path => req.url.includes(path));

      if (err.status === 401 && token && !isAuthEndpoint) {
        return auth.refresh().pipe(
          switchMap(session => {
            const retried = req.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${session.accessToken}` }
            });
            return next(retried);
          }),
          catchError(refreshErr => {
            auth.clearSession();
            return throwError(() => refreshErr);
          })
        );
      }

      return throwError(() => err);
    })
  );
};
