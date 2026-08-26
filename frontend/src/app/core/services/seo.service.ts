import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
  private platformId = inject(PLATFORM_ID);

  set(config: SeoConfig): void {
    const fullTitle = config.title.includes(SITE_NAME) ? config.title : `${config.title} | ${SITE_NAME}`;
    const image = config.image || DEFAULT_IMAGE;

    this.titleService.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'robots', content: config.noindex ? 'noindex, nofollow' : 'index, follow' });

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

    if (isPlatformBrowser(this.platformId)) {
      const url = SITE_URL + window.location.pathname;
      this.setCanonical(url);
      this.meta.updateTag({ property: 'og:url', content: url });
    }
  }

  /** Injects a JSON-LD structured-data block, replacing any previous one this service added. */
  setJsonLd(data: Record<string, unknown>): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let script = document.getElementById('seo-json-ld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'seo-json-ld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  private setCanonical(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
