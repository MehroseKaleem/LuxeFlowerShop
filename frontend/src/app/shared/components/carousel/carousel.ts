import {
  Component,
  ContentChild,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  TemplateRef,
  afterNextRender,
  inject,
  signal
} from '@angular/core';
import { CommonModule, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

const AUTOPLAY_MS = 4000;

/**
 * Generic bounded carousel: works for product cards, collection cards, or
 * any item — the caller supplies the per-item markup via an `<ng-template>`.
 * Shows a fixed number of items per page (responsive to viewport width) and
 * moves exactly one item position per click. The prev button is disabled at
 * the first position, the next button is disabled at the last possible
 * position — it never wraps or skips. Autoplay (when there's more than one
 * page of items) loops back to the start once it reaches the end, but manual
 * button clicks always respect the disabled bounds.
 */
@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, RouterLink, ScrollRevealDirective],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent implements OnChanges, OnDestroy {
  @Input() title = '';
  @Input({ required: true }) items: unknown[] = [];
  @Input() viewAllLink: string | null = null;
  @Input() ariaLabel = 'carousel';
  @Input() tint: 'none' | 'blush' | 'grey' = 'none';

  @ContentChild(TemplateRef) itemTemplate!: TemplateRef<{ $implicit: unknown }>;

  private readonly platformId = inject(PLATFORM_ID);
  protected readonly itemsPerPage = signal(5);
  protected readonly index = signal(0);
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Plain methods, not `computed()` — `items` is a regular `@Input`, not a
   * signal, so a `computed()` reading it would never see it as a reactive
   * dependency and would stay frozen at whatever `items` was on the very
   * first evaluation (typically `[]`, before the parent's data has loaded),
   * permanently hiding/disabling the arrows. Plain methods re-run on every
   * change detection pass instead, so they always reflect the current input.
   */
  protected maxIndex(): number {
    return Math.max(0, this.items.length - this.itemsPerPage());
  }

  /** Sliding is only meaningful once there are more items than fit in one page. */
  protected canSlide(): boolean {
    return this.items.length > this.itemsPerPage();
  }

  protected canPrev(): boolean {
    return this.index() > 0;
  }

  protected canNext(): boolean {
    return this.index() < this.maxIndex();
  }

  constructor() {
    afterNextRender(() => {
      this.updateItemsPerPage();
      this.syncAutoplay();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.index.set(Math.min(this.index(), this.maxIndex()));
      this.syncAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateItemsPerPage();
    this.syncAutoplay();
  }

  private updateItemsPerPage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const width = window.innerWidth;
    this.itemsPerPage.set(width <= 480 ? 1 : width <= 768 ? 2 : width <= 1200 ? 3 : 5);
    this.index.set(Math.min(this.index(), this.maxIndex()));
  }

  private syncAutoplay(): void {
    this.stopAutoplay();
    this.startAutoplay();
  }

  @HostListener('pointerenter')
  pause(): void {
    this.stopAutoplay();
  }

  @HostListener('pointerleave')
  resume(): void {
    this.startAutoplay();
  }

  private startAutoplay(): void {
    if (this.autoplayTimer || !this.canSlide() || !isPlatformBrowser(this.platformId)) return;
    this.autoplayTimer = setInterval(() => {
      this.index.update(i => (i < this.maxIndex() ? i + 1 : 0));
    }, AUTOPLAY_MS);
  }

  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected trackTransform(): string {
    if (!this.canSlide()) return 'translateX(0)';
    return `translateX(calc(-1 * ${this.index()} * (100% + 20px) / ${this.itemsPerPage()}))`;
  }

  next(): void {
    if (!this.canNext()) return;
    this.index.update(i => i + 1);
  }

  prev(): void {
    if (!this.canPrev()) return;
    this.index.update(i => i - 1);
  }
}
