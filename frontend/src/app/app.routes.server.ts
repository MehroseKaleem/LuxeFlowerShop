import { RenderMode, ServerRoute } from '@angular/ssr';

// Public, SEO-relevant storefront pages are fully server-rendered so crawlers
// and link-preview bots (Google, WhatsApp, Facebook, etc.) get real per-page
// content and meta tags instead of one generic shell for every URL.
// Cart/checkout/account/admin are user-specific, carry no SEO value, and stay
// client-rendered.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'shop', renderMode: RenderMode.Server },
  { path: 'category/:slug', renderMode: RenderMode.Server },
  { path: 'search', renderMode: RenderMode.Server },
  { path: 'product/:slug', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'your-moments', renderMode: RenderMode.Server },
  { path: 'contact', renderMode: RenderMode.Server },
  { path: 'privacy-policy', renderMode: RenderMode.Server },
  { path: 'shipping-policy', renderMode: RenderMode.Server },
  { path: 'terms-of-service', renderMode: RenderMode.Server },
  { path: 'refund-policy', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/:slug', renderMode: RenderMode.Server },

  { path: 'cart', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client },
  { path: 'order-confirmation/:orderNumber', renderMode: RenderMode.Client },
  { path: 'account/**', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  { path: '**', renderMode: RenderMode.Client }
];
