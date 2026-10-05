import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

const SITE_NAME = 'Luxeflower';
const SITE_URL = 'https://luxefloweruae.com';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

/**
 * Site-wide kill switch for search engine indexing while the site is still
 * being finalized. When true, every page is forced to noindex regardless of
 * what it passes to `set()`. Flip to false here (and in robots.txt and
 * index.html's robots meta tag) if the site ever needs to be pulled back
 * out of search results, e.g. during a future redesign.
 */
const SITE_LIVE = true;

/**
 * Central place every page calls to set its title + description + Open
 * Graph/Twitter Card tags + canonical URL, so search engines and link
 * previews (WhatsApp, social shares) get consistent, complete metadata
 * everywhere instead of only on the couple of pages that happened to
 * wire up Title/Meta directly.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private titleService = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);
  private router = inject(Router);

  set(config: SeoConfig): void {
    const fullTitle = config.title.includes(SITE_NAME) ? config.title : `${config.title} | ${SITE_NAME}`;
    const image = config.image || DEFAULT_IMAGE;

    this.titleService.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: config.description });
    const noindex = !SITE_LIVE || config.noindex;
    this.meta.updateTag({ name: 'robots', content: noindex ? 'noindex, nofollow' : 'index, follow' });

    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:type', content: config.type || 'website' });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:locale', content: 'en_AE' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    // Router.url (not window.location) so this resolves correctly during
    // SSR too, not just in the browser - a crawler's first fetch of the
    // raw HTML needs each page's own canonical/og:url, not the homepage's
    // (the default baked into index.html), or it can read as every page
    // being a duplicate of the homepage and skip indexing the rest.
    const url = SITE_URL + this.router.url;
    this.setCanonical(url);
    this.meta.updateTag({ property: 'og:url', content: url });
  }

  /** Injects a JSON-LD structured-data block, replacing any previous one this service added. */
  setJsonLd(data: Record<string, unknown>): void {
    let script = this.document.getElementById('seo-json-ld') as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'seo-json-ld';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
