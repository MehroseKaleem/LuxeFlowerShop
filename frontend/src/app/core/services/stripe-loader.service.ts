import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => unknown;
  }
}

const SCRIPT_URL = 'https://js.stripe.com/v3/';

@Injectable({
  providedIn: 'root'
})
export class StripeLoaderService {
  private platformId = inject(PLATFORM_ID);
  private loadPromise: Promise<void> | null = null;

  /** Loads Stripe.js (browser only) and returns a Stripe client instance for the given publishable key. */
  async load(publishableKey: string): Promise<any> {
    if (!isPlatformBrowser(this.platformId)) {
      throw new Error('Stripe can only be loaded in the browser');
    }

    if (!this.loadPromise) {
      this.loadPromise = new Promise<void>((resolve, reject) => {
        if (window.Stripe) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Stripe.js'));
        document.head.appendChild(script);
      });
    }

    await this.loadPromise;
    if (!window.Stripe) throw new Error('Stripe.js failed to initialize');
    return window.Stripe(publishableKey);
  }
}
