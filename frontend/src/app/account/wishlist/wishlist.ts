import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';
import { mediaUrl } from '../../shared/utils/media.util';

@Component({
  selector: 'app-account-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, AedCurrencyPipe],
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss'
})
export class AccountWishlistComponent implements OnInit {
  protected wishlist = inject(WishlistService);
  private cart = inject(CartService);
  private notifications = inject(NotificationService);

  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.wishlist.load().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  imageUrl(url: string | undefined): string {
    return mediaUrl(url);
  }

  remove(productId: number): void {
    this.wishlist.remove(productId).subscribe();
  }

  addToCart(productId: number, name: string): void {
    this.cart.addItem(productId, 1).subscribe({
      next: () => this.notifications.success(`${name} added to cart`)
    });
  }
}
