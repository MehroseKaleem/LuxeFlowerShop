import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';
import { mediaUrl } from '../../shared/utils/media.util';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AedCurrencyPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartComponent implements OnInit {
  protected cartService = inject(CartService);
  private notifications = inject(NotificationService);

  protected readonly loading = signal(true);
  protected readonly couponCode = signal('');
  protected readonly applyingCoupon = signal(false);
  protected readonly updatingItemId = signal<number | null>(null);

  ngOnInit(): void {
    this.cartService.loadCart().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  imageUrl(url: string | null | undefined): string {
    return mediaUrl(url);
  }

  updateQuantity(itemId: number, quantity: number): void {
    if (quantity < 0) return;
    this.updatingItemId.set(itemId);
    this.cartService.updateItemQuantity(itemId, quantity).subscribe({
      next: () => this.updatingItemId.set(null),
      error: () => this.updatingItemId.set(null)
    });
  }

  removeItem(itemId: number): void {
    this.updatingItemId.set(itemId);
    this.cartService.removeItem(itemId).subscribe({
      next: () => this.updatingItemId.set(null),
      error: () => this.updatingItemId.set(null)
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
      error: () => this.applyingCoupon.set(false)
    });
  }

  removeCoupon(): void {
    this.cartService.removeCoupon().subscribe();
  }
}
