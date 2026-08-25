import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../../models/api-response.model';

/**
 * Extracts a user-facing message from a backend error response.
 * Prefers field-level validation messages (`err.error.details[]`), then the
 * top-level `err.error.message`, falling back to the caller-supplied message
 * when the response body doesn't match the expected API error shape.
 */
export function formatApiError(err: HttpErrorResponse, fallback: string): string {
  const body = err.error as ApiErrorBody | undefined;
  if (body?.details?.length) {
    return body.details.map(d => d.message).join(' ');
  }
  return body?.message || fallback;
}
