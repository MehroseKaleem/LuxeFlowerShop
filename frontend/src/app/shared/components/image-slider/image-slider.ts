import { Component, Input, OnChanges, OnDestroy, PLATFORM_ID, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ImgFallbackDirective } from '../../directives/img-fallback.directive';

const SLIDE_MS = 2600;

/**
 * Small self-contained auto-crossfading image loop — used inside cards (e.g.
 * a category card cycling through that category's real product photos)
 * where a full carousel with arrows/dots would be overkill.
 */
@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [CommonModule, ImgFallbackDirective],
  templateUrl: './image-slider.html',
  styleUrl: './image-slider.scss'
})
export class ImageSliderComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) images: string[] = [];
  @Input() alt = '';

  private readonly platformId = inject(PLATFORM_ID);
  protected readonly activeIndex = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      this.activeIndex.set(0);
      this.restart();
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private restart(): void {
    this.stop();
    if (!isPlatformBrowser(this.platformId) || this.images.length <= 1) return;
    this.timer = setInterval(() => {
      this.activeIndex.update(i => (i + 1) % this.images.length);
    }, SLIDE_MS);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
