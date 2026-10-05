import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import compression from 'compression';
import { join } from 'node:path';
import { environment } from './environments/environment.production';

const browserDistFolder = join(import.meta.dirname, '../browser');
const SITE_URL = 'https://luxefloweruae.com';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(compression());

interface SitemapUrl {
  loc: string;
  changefreq: string;
  priority: string;
}

const STATIC_SITEMAP_URLS: SitemapUrl[] = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/shop', changefreq: 'daily', priority: '0.9' },
  { loc: '/recipient-based', changefreq: 'weekly', priority: '0.8' },
  { loc: '/about', changefreq: 'monthly', priority: '0.6' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.5' },
  { loc: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
  { loc: '/shipping-policy', changefreq: 'yearly', priority: '0.2' },
  { loc: '/terms-of-service', changefreq: 'yearly', priority: '0.2' },
  { loc: '/refund-policy', changefreq: 'yearly', priority: '0.2' },
];

function buildSitemapXml(urls: SitemapUrl[]): string {
  const entries = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${SITE_URL}${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

/**
 * Generated fresh from the live catalog on every request, instead of a
 * static file that only ever reflected whatever products/categories
 * existed the one time someone hand-wrote it - which is exactly what was
 * here before (pointing search engines at products that no longer exist,
 * and missing everything added since, including whole category groups).
 * limit=100 covers the current catalog size in one request; revisit with
 * real pagination if the product count ever grows past that.
 */
app.get('/sitemap.xml', async (req, res) => {
  try {
    const [categoriesRes, productsRes] = await Promise.all([
      fetch(`${environment.apiUrl}/categories`).then((r) => r.json()),
      fetch(`${environment.apiUrl}/products?limit=100`).then((r) => r.json()),
    ]);

    const categoryUrls: SitemapUrl[] = (categoriesRes?.data?.categories ?? []).map((c: { slug: string }) => ({
      loc: `/category/${c.slug}`,
      changefreq: 'weekly',
      priority: '0.7',
    }));

    const productUrls: SitemapUrl[] = (productsRes?.data?.products ?? []).map((p: { slug: string }) => ({
      loc: `/product/${p.slug}`,
      changefreq: 'weekly',
      priority: '0.8',
    }));

    res.setHeader('Content-Type', 'application/xml');
    res.send(buildSitemapXml([...STATIC_SITEMAP_URLS, ...categoryUrls, ...productUrls]));
  } catch (err) {
    console.error('[sitemap] Failed to generate dynamic sitemap, falling back to static pages only:', err);
    res.setHeader('Content-Type', 'application/xml');
    res.send(buildSitemapXml(STATIC_SITEMAP_URLS));
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
