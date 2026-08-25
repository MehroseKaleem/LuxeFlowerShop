import { Component, HostListener, Input, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ProductListItem } from '../../../models/product.model';
import { ProductCardComponent } from '../product-card/product-card';
import { ScrollRevealDirective } from '../../directives/scroll-reveal.directive';

@Component({
  selector: 'app-featured-coverflow',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, ScrollRevealDirective],
  templateUrl: './featured-coverflow.html',
  styleUrl: './featured-coverflow.scss'
})
export class FeaturedCoverflowComponent implements OnInit, OnDestroy {
  @Input({ required: true }) products: ProductListItem[] = [];

  private platformId = inject(PLATFORM_ID);
  protected readonly activeIndex = signal(0);
  private timer: ReturnType<typeof setInterval> | null = null;

  /* Bounded like every other slider on the site: the prev button disables at
     the first card, the next button disables at the last — no wraparound,
     never skips a position. Autoplay still loops back to the start once it
     reaches the end so the section stays lively without user interaction.
     Plain methods, not `computed()` — `products` is a regular `@Input`, not
     a signal, so `computed()` would never treat it as a reactive dependency
     and would stay frozen at its first evaluation (typically empty, before
     the parent's data has loaded), permanently disabling the arrows. */
  protected canPrev(): boolean {
    return this.activeIndex() > 0;
  }

  protected canNext(): boolean {
    return this.activeIndex() < this.products.length - 1;
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => this.autoplayTick(), 4200);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  @HostListener('mouseenter')
  pause(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  @HostListener('mouseleave')
  resume(): void {
    if (isPlatformBrowser(this.platformId) && !this.timer) {
      this.timer = setInterval(() => this.autoplayTick(), 4200);
    }
  }

  private autoplayTick(): void {
    this.activeIndex.update(i => (i < this.products.length - 1 ? i + 1 : 0));
  }

  next(): void {
    if (!this.canNext()) return;
    this.activeIndex.update(i => i + 1);
  }

  prev(): void {
    if (!this.canPrev()) return;
    this.activeIndex.update(i => i - 1);
  }

  goTo(index: number): void {
    this.activeIndex.set(index);
  }

  /** Shortest distance from the active slide, used to derive each card's depth/position. */
  offsetFor(index: number): number {
    return index - this.activeIndex();
  }

  cardStyle(index: number): Record<string, string> {
    const offset = this.offsetFor(index);
    const abs = Math.abs(offset);

    if (abs > 2) {
      return { transform: 'translateX(0) scale(0.5)', opacity: '0', 'z-index': '0', 'pointer-events': 'none' };
    }

    const translateX = offset * 62;
    const scale = abs === 0 ? 1.12 : abs === 1 ? 0.82 : 0.62;
    const rotateY = offset === 0 ? 0 : offset > 0 ? -22 : 22;
    const translateZ = -abs * 120;
    const opacity = abs === 0 ? 1 : abs === 1 ? 0.75 : 0.4;

    return {
      transform: `translateX(${translateX}%) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity: String(opacity),
      'z-index': String(10 - abs),
      'pointer-events': abs === 0 ? 'auto' : 'none'
    };
  }
}
