import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { IMAGE_FALLBACK } from '../utils/media.util';

/**
 * Swaps a broken `<img>` (backend-hosted product/category/banner photo that
 * 404s — e.g. local-disk uploads that don't exist on a fresh deploy) to a
 * bundled placeholder instead of showing the browser's broken-image icon.
 */
@Directive({
  selector: 'img[appImgFallback]',
  standalone: true
})
export class ImgFallbackDirective {
  @Input('appImgFallback') fallback = IMAGE_FALLBACK;

  private readonly el = inject(ElementRef<HTMLImageElement>);
  private swapped = false;

  @HostListener('error')
  onError(): void {
    if (this.swapped) return;
    this.swapped = true;
    this.el.nativeElement.src = this.fallback;
  }
}
