import { Directive, ElementRef, Input, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { animate } from 'motion';

export type RevealStyle = 'up' | 'scale' | 'fade' | 'left' | 'right';

/**
 * Fades/lifts an element into view the first time it crosses the viewport,
 * using `motion`'s spring-based `animate()` rather than a linear CSS
 * transition so it reads as physical rather than mechanical.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit, OnDestroy {
  @Input('appReveal') style: RevealStyle = 'up';
  @Input() revealDelay = 0;

  private el = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private observer: IntersectionObserver | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const node = this.el.nativeElement;
    node.setAttribute('data-reveal', '');

    const from = this.fromState();

    if (!('IntersectionObserver' in window)) {
      Object.assign(node.style, { opacity: '1' });
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.observer?.unobserve(node);
            setTimeout(() => {
              animate(
                node,
                { opacity: [0, 1], ...from.animate },
                { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
              );
            }, this.revealDelay);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    this.observer.observe(node);
  }

  private fromState(): { animate: Record<string, [number | string, number | string]> } {
    switch (this.style) {
      case 'scale':
        return { animate: { scale: [0.92, 1] } };
      case 'left':
        return { animate: { x: [-40, 0] } };
      case 'right':
        return { animate: { x: [40, 0] } };
      case 'fade':
        return { animate: {} };
      case 'up':
      default:
        return { animate: { y: [36, 0] } };
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
