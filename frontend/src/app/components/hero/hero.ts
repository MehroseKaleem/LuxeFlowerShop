import { Component, HostListener, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BannerService } from '../../services/banner.service';
import { Tilt3dDirective } from '../../shared/directives/tilt-3d.directive';
import { mediaUrl } from '../../shared/utils/media.util';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';

interface HeroSlide {
  image: string;
  label: string;
  link: string | null;
}

const FALLBACK_SLIDES: HeroSlide[] = [
  { image: '/bouquet-pink-luxury.png', label: 'Rose Bouquets', link: '/category/rose-bouquets' },
  { image: '/bouquet-orange-luxury.png', label: 'Anniversary Special', link: '/category/anniversary-special' },
  { image: '/rosesinbox.jpeg', label: 'Roses In A Box', link: '/category/roses-in-a-box' },
  { image: '/valentines.png', label: "Valentine's Collection", link: '/category/valentines-day-collection' },
  { image: '/julietbouquet.jpeg', label: 'Julieta Mix', link: '/category/julieta-mix' }
];

const AUTOPLAY_MS = 4500;
const PETAL_COUNT = 30;

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, Tilt3dDirective, ImgFallbackDirective],
  templateUrl: './hero.html',
  styleUrl: './hero.scss'
})
export class HeroComponent implements OnInit, OnDestroy {
  private bannerService = inject(BannerService);
  private platformId = inject(PLATFORM_ID);

  protected readonly slides = signal<HeroSlide[]>(FALLBACK_SLIDES);
  protected readonly activeIndex = signal(0);
  protected readonly parallaxOffset = signal(0);
  protected readonly petals = Array.from({ length: PETAL_COUNT }, (_, i) => i + 1);
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.bannerService.list('HOME_HERO').subscribe({
      next: banners => {
        if (banners.length) {
          this.slides.set(
            banners.map(b => ({ image: mediaUrl(b.imageUrl), label: b.title, link: b.link || null }))
          );
        }
      },
      error: () => undefined
    });

    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private startAutoplay(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => this.next(), AUTOPLAY_MS);
    }
  }

  private stopAutoplay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  @HostListener('mouseenter')
  pause(): void {
    this.stopAutoplay();
  }

  @HostListener('mouseleave')
  resume(): void {
    if (!this.timer) this.startAutoplay();
  }

  next(): void {
    this.activeIndex.update(i => (i + 1) % this.slides().length);
  }

  prev(): void {
    this.activeIndex.update(i => (i - 1 + this.slides().length) % this.slides().length);
  }

  goTo(index: number): void {
    this.activeIndex.set(index);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.parallaxOffset.set(Math.min(window.scrollY * 0.25, 120));
    }
  }
}
