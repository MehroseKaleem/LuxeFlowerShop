import { AfterViewInit, Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { IMAGE_FALLBACK } from '../utils/media.util';

/**
 * Swaps a broken `<img>` (backend-hosted product/category/banner photo that
 * 404s — e.g. local-disk uploads that don't exist on a fresh deploy) to a
 * bundled placeholder instead of showing the browser's broken-image icon.
 * Also catches the case where `src` ends up empty/missing entirely (a
 * genuine network 404 fires the `error` event; a blank `src` never does,
 * since the browser skips the fetch altogether — so that path is checked
 * explicitly here too).
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true
})
export class ImgFallbackDirective implements AfterViewInit {
  @Input('appImgFallback') fallback = IMAGE_FALLBACK;

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private swapped = false;

  @HostListener('error')
  onError(): void {
    this.swapToFallback();
  }

  ngAfterViewInit(): void {
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
