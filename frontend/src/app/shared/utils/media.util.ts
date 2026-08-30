import { environment } from '../../../environments/environment';

const API_ORIGIN = environment.apiUrl.replace(/\/api\/v\d+\/?$/, '');

/**
 * Inline hand-drawn flower illustration shown wherever a real photo is
 * missing or fails to load, instead of a generic stock photo. Encoded as a
 * data URI so it works as a plain <img src> with zero extra network
 * requests, everywhere mediaUrl()'s default fallback or appImgFallback is used.
 */
export const IMAGE_FALLBACK =
  'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMzAwIDMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0ibm9uZSI+PC9yZWN0PgogIDxsaW5lIHgxPSIxNTAiIHkxPSIxODAiIHgyPSIxNDQiIHkyPSIyNzAiIHN0cm9rZT0iIzRiNmI0ZiIgc3Ryb2tlLXdpZHRoPSI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiPjwvbGluZT4KICA8bGluZSB4MT0iMTUwIiB5MT0iMjEwIiB4Mj0iMTcyIiB5Mj0iMjMwIiBzdHJva2U9IiM0YjZiNGYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIj48L2xpbmU+CiAgPGVsbGlwc2UgY3g9IjE3NC45IiBjeT0iMTg4LjciIHJ4PSIzMCIgcnk9IjIwIiBmaWxsPSIjZTdjODkzIiBvcGFjaXR5PSIwLjg1IiB0cmFuc2Zvcm09InJvdGF0ZSg1Ny4yOTU3Nzk1MTMwODIzMiAxNzQuOSAxODguNykiPjwvZWxsaXBzZT48ZWxsaXBzZSBjeD0iMTI4LjkiIGN5PSIxOTAuOSIgcng9IjMwIiByeT0iMjAiIGZpbGw9IiNlN2M4OTMiIG9wYWNpdHk9IjAuODUiIHRyYW5zZm9ybT0icm90YXRlKDExNy4yOTU3Nzk1MTMwODIzIDEyOC45IDE5MC45KSI+PC9lbGxpcHNlPjxlbGxpcHNlIGN4PSIxMDQuMSIgY3k9IjE1Mi4yIiByeD0iMzAiIHJ5PSIyMCIgZmlsbD0iI2U3Yzg5MyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoMTc3LjI5NTc3OTUxMzA4MjMyIDEwNC4xIDE1Mi4yKSI+PC9lbGxpcHNlPjxlbGxpcHNlIGN4PSIxMjUuMSIgY3k9IjExMS4zIiByeD0iMzAiIHJ5PSIyMCIgZmlsbD0iI2U3Yzg5MyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoMjM3LjI5NTc3OTUxMzA4MjMyIDEyNS4xIDExMS4zKSI+PC9lbGxpcHNlPjxlbGxpcHNlIGN4PSIxNzEuMSIgY3k9IjEwOS4xIiByeD0iMzAiIHJ5PSIyMCIgZmlsbD0iI2U3Yzg5MyIgb3BhY2l0eT0iMC44NSIgdHJhbnNmb3JtPSJyb3RhdGUoMjk3LjI5NTc3OTUxMzA4MjMgMTcxLjEgMTA5LjEpIj48L2VsbGlwc2U+PGVsbGlwc2UgY3g9IjE5NS45IiBjeT0iMTQ3LjgiIHJ4PSIzMCIgcnk9IjIwIiBmaWxsPSIjZTdjODkzIiBvcGFjaXR5PSIwLjg1IiB0cmFuc2Zvcm09InJvdGF0ZSgzNTcuMjk1Nzc5NTEzMDgyMyAxOTUuOSAxNDcuOCkiPjwvZWxsaXBzZT4KICA8Y2lyY2xlIGN4PSIxNTAiIGN5PSIxNTAiIHI9IjM0IiBmaWxsPSIjYTY3YTNkIj48L2NpcmNsZT4KPC9zdmc+';

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
export function mediaUrl(path: string | null | undefined, fallback = IMAGE_FALLBACK, width?: number): string {
  if (!path) return fallback;
  const url = /^https?:\/\//i.test(path) ? path : `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;

  if (url.includes('res.cloudinary.com/') && url.includes('/upload/')) {
    const transform = width ? `f_auto,q_auto,w_${width},c_limit` : 'f_auto,q_auto';
    return url.replace('/upload/', `/upload/${transform}/`);
  }

  return url;
}
