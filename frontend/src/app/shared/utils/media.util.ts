import { environment } from '../../../environments/environment';

const API_ORIGIN = environment.apiUrl.replace(/\/api\/v\d+\/?$/, '');

/** Resolves a backend-relative media path (e.g. "/uploads/products/x.svg") to an absolute URL. */
export function mediaUrl(path: string | null | undefined, fallback = '/flowers.jpeg'): string {
  if (!path) return fallback;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}
