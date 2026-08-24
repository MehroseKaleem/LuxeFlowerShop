import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const STORAGE_KEY = 'luxeflower_cart_session';

@Injectable({
  providedIn: 'root'
})
export class CartSessionService {
  private platformId = inject(PLATFORM_ID);
  private cachedId: string | null = null;

  /** Returns the guest cart session id, creating and persisting one on first use. Returns null during SSR. */
  getOrCreateSessionId(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    if (this.cachedId) return this.cachedId;

    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    this.cachedId = id;
    return id;
  }

  clear(): void {
    this.cachedId = null;
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
