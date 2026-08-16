import { Component, HostListener, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Sparkle {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  color: 'pink' | 'white';
}

const SPARKLE_COUNT = 34;

function generateSparkles(): Sparkle[] {
  return Array.from({ length: SPARKLE_COUNT }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 6,
    duration: 3 + Math.random() * 4,
    color: Math.random() > 0.65 ? 'pink' : 'white'
  }));
}

/**
 * A fixed, full-viewport decorative layer sitting behind every storefront
 * page: three blurred orbs drift at different rates as the page scrolls for
 * a sense of 3D depth, plus a scattering of tiny twinkling sparkles for an
 * ambient, luxury-glitter feel.
 */
@Component({
  selector: 'app-ambient-background',
  standalone: true,
  templateUrl: './ambient-background.html',
  styleUrl: './ambient-background.scss'
})
export class AmbientBackgroundComponent {
  private platformId = inject(PLATFORM_ID);
  protected readonly scrollY = signal(0);
  protected readonly sparkles = generateSparkles();

  @HostListener('window:scroll')
  onScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.scrollY.set(window.scrollY);
    }
  }

  protected offset(rate: number, max = 260): string {
    const value = Math.min(this.scrollY() * rate, max);
    return `translate3d(0, ${value}px, 0)`;
  }
}
