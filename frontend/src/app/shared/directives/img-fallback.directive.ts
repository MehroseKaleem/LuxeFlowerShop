import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { IMAGE_FALLBACK } from '../utils/media.util';

/**
 * Swaps a broken `<img>` (backend-hosted product/category/banner photo that
 * 404s — e.g. local-disk uploads that don't exist on a fresh deploy) to a
 * bundled placeholder instead of showing the browser's broken-image icon.
 * Three failure paths are covered: a genuine network fetch failure (the
 * `error` event), `src` being empty/missing from the start, and `src`
 * later becoming empty/missing through any subsequent DOM change (a
 * MutationObserver on the attribute, since Angular re-binding `[src]` or
 * anything else mutating the element after init wouldn't otherwise be seen).
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true
})
export class ImgFallbackDirective implements AfterViewInit, OnDestroy {
  @Input('appImgFallback') fallback = IMAGE_FALLBACK;

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private readonly platformId = inject(PLATFORM_ID);
  private swapped = false;
  private observer: MutationObserver | null = null;

  @HostListener('error')
  onError(): void {
    this.swapToFallback();
  }

  ngAfterViewInit(): void {
    this.checkSrc();
    // MutationObserver is browser-only — SSR runs this in Node, where it doesn't exist.
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new MutationObserver(() => this.checkSrc());
      this.observer.observe(this.el.nativeElement, { attributes: true, attributeFilter: ['src'] });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private checkSrc(): void {
    if (this.swapped) return;
    if (!this.el.nativeElement.getAttribute('src')) {
      this.swapToFallback();
    }
  }

  private swapToFallback(): void {
    if (this.swapped) return;
    this.swapped = true;
    this.el.nativeElement.src = this.fallback;
  }
}
