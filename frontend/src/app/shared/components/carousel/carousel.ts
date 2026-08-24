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
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

const RESET_DELAY_MS = 560;
const AUTOPLAY_MS = 4000;

/**
 * Generic infinite, full-width carousel: works for product cards, collection
 * cards, or any item — the caller supplies the per-item markup via an
 * `<ng-template>`. The item list is tripled internally so "next"/"prev"
 * always has real cards to slide in (never runs out and shows blank space),
 * and the position silently snaps back a copy-width once it drifts into the
 * outer copies, so the loop is seamless in both directions. On mobile the
 * arrow buttons are hidden (see carousel.scss) and it auto-advances instead.
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
  protected readonly rawIndex = signal(0);
  protected readonly instant = signal(false);
  private resetTimer: ReturnType<typeof setTimeout> | null = null;
  private autoplayTimer: ReturnType<typeof setInterval> | null = null;

  /** Looping only makes sense once there are more items than fit in one view — otherwise
   *  tripling the array would show the same product twice in the same visible row. */
  protected readonly needsLoop = computed(() => this.items.length > this.itemsPerPage());

  protected readonly displayItems = computed(() => {
    const n = this.items.length;
    if (n === 0) return [];
    if (!this.needsLoop()) return this.items;
    return [...this.items, ...this.items, ...this.items];
  });

  constructor() {
    afterNextRender(() => {
      this.updateItemsPerPage();
      this.syncAutoplay();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-center whenever a new item set arrives (e.g. async data load).
    if (changes['items']) {
      this.rawIndex.set(this.needsLoop() ? this.items.length : 0);
      this.syncAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateItemsPerPage();
    this.syncAutoplay();
  }

  private updateItemsPerPage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const width = window.innerWidth;
    const wasLooping = this.needsLoop();
    this.itemsPerPage.set(width <= 480 ? 1 : width <= 768 ? 2 : width <= 1200 ? 3 : 5);
    if (this.needsLoop() !== wasLooping) {
      this.rawIndex.set(this.needsLoop() ? this.items.length : 0);
    }
  }

  private syncAutoplay(): void {
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
    if (this.autoplayTimer || !this.needsLoop()) return;
    this.autoplayTimer = setInterval(() => this.next(), AUTOPLAY_MS);
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
    if (!this.needsLoop()) return 'translateX(0)';
    return `translateX(calc(-1 * ${this.rawIndex()} * (100% + 20px) / ${this.itemsPerPage()}))`;
  }

  next(): void {
    if (!this.needsLoop()) return;
    this.rawIndex.update(i => i + 1);
    this.scheduleWrapCheck();
  }

  prev(): void {
    if (!this.needsLoop()) return;
    this.rawIndex.update(i => i - 1);
    this.scheduleWrapCheck();
  }

  private scheduleWrapCheck(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const n = this.items.length;
    if (this.resetTimer) clearTimeout(this.resetTimer);

    this.resetTimer = setTimeout(() => {
      const i = this.rawIndex();
      if (i >= 2 * n) {
        this.snapTo(i - n);
      } else if (i < 0) {
        this.snapTo(i + n);
      }
    }, RESET_DELAY_MS);
  }

  private snapTo(index: number): void {
    this.instant.set(true);
    this.rawIndex.set(index);
    requestAnimationFrame(() => requestAnimationFrame(() => this.instant.set(false)));
  }
}
