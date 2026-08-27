import { environment } from '../../../environments/environment';

const API_ORIGIN = environment.apiUrl.replace(/\/api\/v\d+\/?$/, '');

/**
 * Resolves a backend-relative media path (e.g. "/uploads/products/x.svg")
 * to an absolute URL, and for Cloudinary-hosted images, applies automatic
 * format/quality optimization (f_auto,q_auto - serves WebP/AVIF where
 * supported at a smart compression level) plus an optional max width so
 * small thumbnails don't ship full-resolution source photos to the
 * browser. Pass `width` for anything rendered smaller than its source
 * image (grid thumbnails, list rows) - leave it unset for full-bleed
 * hero/banner images where only the format/quality win applies.
 */
export function mediaUrl(path: string | null | undefined, fallback = '/flowers.jpeg', width?: number): string {
  if (!path) return fallback;
  const url = /^https?:\/\//i.test(path) ? path : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;

  if (url.includes('res.cloudinary.com/') && url.includes('/upload/')) {
    const transform = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
    return url.replace('/upload/', `/upload/${transform}/`);
  }

  return url;
}
