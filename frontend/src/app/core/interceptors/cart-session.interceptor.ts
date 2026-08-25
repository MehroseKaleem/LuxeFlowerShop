import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CartSessionService } from '../services/cart-session.service';

export const cartSessionInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const auth = inject(AuthService);
  if (auth.isLoggedIn()) {
    return next(req);
  }

  const cartSession = inject(CartSessionService);
  const sessionId = cartSession.getOrCreateSessionId();
  if (!sessionId) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'x-cart-session': sessionId } }));
};
