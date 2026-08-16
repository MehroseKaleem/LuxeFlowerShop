import { HttpParams } from '@angular/common/http';

/** Builds HttpParams from a plain query object, skipping undefined/null/empty-string values. */
export function toHttpParams<T extends object>(query: T): HttpParams {
  let params = new HttpParams();
  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  });
  return params;
}
