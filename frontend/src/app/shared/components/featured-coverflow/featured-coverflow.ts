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

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => this.next(), 4200);
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
      this.timer = setInterval(() => this.next(), 4200);
    }
  }

  next(): void {
    this.activeIndex.update(i => (i + 1) % this.products.length);
  }

  prev(): void {
    this.activeIndex.update(i => (i - 1 + this.products.length) % this.products.length);
  }

  goTo(index: number): void {
    this.activeIndex.set(index);
  }

  /** Shortest circular distance from the active slide, used to derive each card's depth/position. */
  offsetFor(index: number): number {
    const count = this.products.length;
    let diff = index - this.activeIndex();
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
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
