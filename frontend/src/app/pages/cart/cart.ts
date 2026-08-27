import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { SeoService } from '../../core/services/seo.service';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';
import { mediaUrl } from '../../shared/utils/media.util';
import { formatApiError } from '../../shared/utils/api-error.util';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AedCurrencyPipe, ImgFallbackDirective],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent implements OnInit {
  protected cartService = inject(CartService);
  private notifications = inject(NotificationService);
  private seo = inject(SeoService);

  protected readonly loading = signal(true);
  protected readonly couponCode = signal('');
  protected readonly applyingCoupon = signal(false);
  protected readonly updatingItemId = signal<number | null>(null);

  ngOnInit(): void {
    this.seo.set({ title: 'Your Cart', description: 'Review the items in your Luxeflower cart before checkout.', noindex: true });

    this.cartService.loadCart().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  imageUrl(url: string | null | undefined): string {
    return mediaUrl(url, undefined, 200);
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity < 0) return;
    this.updatingItemId.set(itemId);
    this.cartService.updateItemQuantity(itemId, quantity).subscribe({
      next: () => this.updatingItemId.set(null),
      error: (err: HttpErrorResponse) => {
        this.updatingItemId.set(null);
        this.notifications.error(formatApiError(err, 'Could not update the item quantity. Please try again.'));
      }
    });
  }

  removeItem(itemId: number): void {
    this.updatingItemId.set(itemId);
    this.cartService.removeItem(itemId).subscribe({
      next: () => this.updatingItemId.set(null),
      error: (err: HttpErrorResponse) => {
        this.updatingItemId.set(null);
        this.notifications.error(formatApiError(err, 'Could not remove the item. Please try again.'));
      }
    });
  }

  applyCoupon(): void {
    const code = this.couponCode().trim();
    if (!code) return;

    this.applyingCoupon.set(true);
    this.cartService.applyCoupon(code).subscribe({
      next: () => {
        this.applyingCoupon.set(false);
        this.couponCode.set('');
        this.notifications.success('Coupon applied!');
      },
      error: (err: HttpErrorResponse) => {
        this.applyingCoupon.set(false);
        this.notifications.error(formatApiError(err, 'Could not apply this coupon. Please check the code and try again.'));
      }
    });
  }

  removeCoupon(): void {
    this.cartService.removeCoupon().subscribe({
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not remove the coupon. Please try again.'))
    });
  }
}
