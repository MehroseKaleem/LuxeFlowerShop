// Generates public/sitemap.xml from the live catalog (categories + products)
// plus the site's static pages. Run before `ng build` in production so the
// shipped sitemap always reflects the current catalog:
//   node scripts/generate-sitemap.js
//
// Reads the backend API URL from SITEMAP_API_URL / SITEMAP_SITE_URL env vars,
// falling back to the local dev backend and the production domain.

const fs = require('fs');
const path = require('path');

const API_URL = process.env.SITEMAP_API_URL || 'http://localhost:5000/api/v1';
const SITE_URL = process.env.SITEMAP_SITE_URL || 'https://luxefloweruae.com';

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/blog', changefreq: 'weekly', priority: '0.5' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.2' },
  { path: '/shipping-policy', changefreq: 'yearly', priority: '0.2' },
  { path: '/terms-of-service', changefreq: 'yearly', priority: '0.2' },
  { path: '/refund-policy', changefreq: 'yearly', priority: '0.2' },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function urlEntry(loc, changefreq, priority) {
  return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

async function main() {
  const entries = STATIC_PAGES.map(p => urlEntry(SITE_URL + p.path, p.changefreq, p.priority));

  try {
    const categoriesRes = await fetchJson(`${API_URL}/categories`);
    const categories = categoriesRes?.data?.categories || [];
    for (const cat of categories) {
      entries.push(urlEntry(`${SITE_URL}/category/${cat.slug}`, 'weekly', '0.7'));
    }
    console.log(`Added ${categories.length} category URLs`);
  } catch (err) {
    console.warn('Could not fetch categories for sitemap (is the backend running?):', err.message);
  }

  try {
    const productsRes = await fetchJson(`${API_URL}/products?limit=200`);
    const products = productsRes?.data?.products || [];
    for (const product of products) {
      entries.push(urlEntry(`${SITE_URL}/product/${product.slug}`, 'weekly', '0.8'));
    }
    console.log(`Added ${products.length} product URLs`);
  } catch (err) {
    console.warn('Could not fetch products for sitemap (is the backend running?):', err.message);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outPath, xml, 'utf8');
  console.log(`Wrote ${entries.length} URLs to ${outPath}`);
}

main().catch(err => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
