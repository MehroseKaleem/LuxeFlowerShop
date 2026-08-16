import { Directive, ElementRef, HostListener, Input, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { animate } from 'motion';

/**
 * Subtle pointer-tracked 3D tilt for cards — rotates on the cursor's
 * position within the element and springs back to flat on leave. Kept
 * gentle (a few degrees) so it reads as premium polish, not a gimmick.
 */
@Directive({
  selector: '[appTilt3d]',
  standalone: true
})
export class Tilt3dDirective implements OnInit {
  @Input() tiltMax = 8;
  @Input() tiltLift = 10;

  private el = inject(ElementRef<HTMLElement>);
  private platformId = inject(PLATFORM_ID);
  private raf: number | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // A short CSS transition smooths every JS-driven transform change —
    // including the very first pointermove, which would otherwise snap
    // the tilt in instantly instead of easing into it.
    this.el.nativeElement.style.transition = 'transform 0.2s ease-out';
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId) || event.pointerType === 'touch') return;

    const node = this.el.nativeElement;
    if (this.raf) cancelAnimationFrame(this.raf);

    this.raf = requestAnimationFrame(() => {
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * this.tiltMax * 2;
      const rotateX = (0.5 - py) * this.tiltMax * 2;

      node.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-${this.tiltLift}px) scale(1.015)`;
    });
  }

  @HostListener('pointerleave')
  onPointerLeave(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.raf) cancelAnimationFrame(this.raf);

    const node = this.el.nativeElement;
    animate(
      node,
      { transform: ['none'] },
      { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    );
  }
}
