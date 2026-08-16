import { Component, signal, OnDestroy, OnInit, afterNextRender, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BannerService } from '../../services/banner.service';
import { mediaUrl } from '../../shared/utils/media.util';

interface Slide {
  image: string;
  alt: string;
  link: string | null;
}

const FALLBACK_SLIDES: Slide[] = [
  { image: '/hero-slide-1.png', alt: 'Crafted With Love For Every Occasion', link: null },
  { image: '/hero-slide-2.png', alt: 'Beautiful Flowers Timeless Memories', link: null }
];

@Component({
  selector: 'app-hero-carousel',
  standalone: true,
  imports: [],
  templateUrl: './hero-carousel.html',
  styleUrl: './hero-carousel.scss'
})
export class HeroCarouselComponent implements OnInit, OnDestroy {
  private bannerService = inject(BannerService);
  protected readonly currentSlide = signal(0);
  protected readonly isPlaying = signal(true);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly slides = signal<Slide[]>(FALLBACK_SLIDES);

  constructor() {
    afterNextRender(() => {
      this.startAutoPlay();
    });
  }

  ngOnInit(): void {
    this.bannerService.list('HOME_HERO').subscribe({
      next: banners => {
        if (banners.length) {
          this.slides.set(
            banners.map(b => ({ image: mediaUrl(b.imageUrl), alt: b.title, link: b.link }))
          );
          this.currentSlide.set(0);
        }
      },
      error: () => undefined
    });
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.restartAutoPlay();
  }

  prevSlide(): void {
    const current = this.currentSlide();
    this.currentSlide.set(current === 0 ? this.slides().length - 1 : current - 1);
    this.restartAutoPlay();
  }

  nextSlide(): void {
    const current = this.currentSlide();
    this.currentSlide.set(current === this.slides().length - 1 ? 0 : current + 1);
    this.restartAutoPlay();
  }

  toggleAutoPlay(): void {
    if (this.isPlaying()) {
      this.stopAutoPlay();
      this.isPlaying.set(false);
    } else {
      this.startAutoPlay();
      this.isPlaying.set(true);
    }
  }

  private startAutoPlay(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = setInterval(() => {
        this.nextSlide();
      }, 5000);
    }
  }

  private stopAutoPlay(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private restartAutoPlay(): void {
    if (this.isPlaying()) {
      this.stopAutoPlay();
      this.startAutoPlay();
    }
  }
}
