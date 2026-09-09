import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const SWIPE_THRESHOLD_PX = 40;
const SWIPE_MAX_VERTICAL_PX = 60;

/**
 * Emits swipeLeft/swipeRight for a horizontal finger drag on touch screens,
 * so sliders can be navigated the way users actually expect on mobile
 * instead of only via the arrow buttons. Listens with { passive: true } and
 * never calls preventDefault, so normal vertical page scrolling is
 * untouched - only the resulting horizontal delta at touchend decides
 * whether this was a swipe, and a mostly-vertical drag is ignored so it
 * doesn't hijack scrolling. Mobile browsers already suppress the synthetic
 * click on a dragged element, so swiping across a card inside a slider
 * doesn't also trigger it as a tap.
 */
@Directive({
  selector: '[appSwipe]',
  standalone: true
})
export class SwipeDirective implements OnInit, OnDestroy {
  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  private startX = 0;
  private startY = 0;
  private tracking = false;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const node = this.el.nativeElement;
    node.addEventListener('touchstart', this.onTouchStart, { passive: true });
    node.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  ngOnDestroy(): void {
    const node = this.el.nativeElement;
    node.removeEventListener('touchstart', this.onTouchStart);
    node.removeEventListener('touchend', this.onTouchEnd);
  }

  private onTouchStart = (event: TouchEvent): void => {
    if (event.touches.length !== 1) return;
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
    this.tracking = true;
  };

  private onTouchEnd = (event: TouchEvent): void => {
    if (!this.tracking) return;
    this.tracking = false;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;

    if (Math.abs(dy) > SWIPE_MAX_VERTICAL_PX) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;

    if (dx < 0) this.swipeLeft.emit();
    else this.swipeRight.emit();
  };
}
