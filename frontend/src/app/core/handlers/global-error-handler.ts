import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../services/notification.service';

/**
 * Safety net for uncaught runtime exceptions (template/rendering bugs, etc.)
 * so the user sees a friendly toast instead of a blank/frozen page. HTTP
 * errors are already handled by `errorInterceptor` and are ignored here to
 * avoid double-reporting the same failure.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private injector = inject(Injector);

  handleError(error: unknown): void {
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorHandler]', error);

    if (error instanceof HttpErrorResponse) return;

    try {
      const notifications = this.injector.get(NotificationService);
      notifications.error('Something went wrong. Please refresh and try again.');
    } catch {
      // Notification service itself unavailable (e.g. during SSR) — swallow.
    }
  }
}
