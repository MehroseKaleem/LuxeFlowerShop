import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductListItem } from '../../../models/product.model';
import { CartService } from '../../../services/cart.service';
import { WishlistService } from '../../../services/wishlist.service';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AedCurrencyPipe } from '../../pipes/aed-currency.pipe';
import { Tilt3dDirective } from '../../directives/tilt-3d.directive';
import { mediaUrl } from '../../../shared/utils/media.util';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, AedCurrencyPipe, Tilt3dDirective],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss'
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductListItem;

  private cart = inject(CartService);
  private wishlist = inject(WishlistService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private router = inject(Router);

  protected readonly adding = signal(false);

  get primaryImage(): string {
    return mediaUrl(this.product.images?.[0]?.url);
  }

  get isOnSale(): boolean {
    return !!this.product.discountPrice;
  }

  get isWishlisted(): boolean {
    return this.wishlist.isWishlisted(this.product.id);
  }

  get filledStars(): number[] {
    return Array(Math.min(5, Math.max(0, Math.round(Number(this.product.avgRating) || 0)))).fill(0);
  }

  get emptyStars(): number[] {
    return Array(5 - this.filledStars.length).fill(0);
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.product.stock <= 0) {
      this.notifications.error('This product is currently out of stock.');
      return;
    }

    this.adding.set(true);
    this.cart.addItem(this.product.id, 1).subscribe({
      next: () => {
        this.adding.set(false);
        this.notifications.success(`${this.product.name} added to cart`);
      },
      error: () => this.adding.set(false)
    });
  }

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/account/login']);
      return;
    }

    if (this.isWishlisted) {
      this.wishlist.remove(this.product.id).subscribe();
    } else {
      this.wishlist.add(this.product.id).subscribe();
    }
  }
}
