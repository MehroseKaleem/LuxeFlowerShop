import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from '../services/notification.service';
import { ApiErrorBody } from '../../models/api-response.model';

// Statuses that individual forms/pages already surface inline (validation
// errors, not-found, conflicts) — a global toast on top would be noise.
const SILENT_STATUSES = new Set([400, 401, 404, 409, 422]);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (req.url.startsWith(environment.apiUrl) && !SILENT_STATUSES.has(err.status)) {
        const body = err.error as ApiErrorBody | undefined;
        const message = body?.message || 'Something went wrong. Please try again in a moment.';
        notifications.error(message);
      }
      return throwError(() => err);
    })
  );
};
