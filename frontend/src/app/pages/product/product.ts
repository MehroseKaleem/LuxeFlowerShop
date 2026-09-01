import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Product, ProductListItem } from '../../models/product.model';
import { Review } from '../../models/review.model';
import { ProductService } from '../../services/product.service';
import { ReviewService } from '../../services/review.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';
import { CarouselComponent } from '../../shared/components/carousel/carousel';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';
import { mediaUrl, IMAGE_FALLBACK } from '../../shared/utils/media.util';
import { ScrollRevealDirective } from '../../shared/directives/scroll-reveal.directive';
import { Tilt3dDirective } from '../../shared/directives/tilt-3d.directive';
import { SeoService } from '../../core/services/seo.service';
import { formatApiError } from '../../shared/utils/api-error.util';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AedCurrencyPipe,
    CarouselComponent,
    ProductCardComponent,
    ImgFallbackDirective,
    ScrollRevealDirective,
    Tilt3dDirective
  ],
  templateUrl: './product.html',
  styleUrl: './product.scss'
})
export class ProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private reviewService = inject(ReviewService);
  private cartService = inject(CartService);
  private wishlistService = inject(WishlistService);
  protected auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private seo = inject(SeoService);

  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly product = signal<Product | null>(null);
  protected readonly related = signal<ProductListItem[]>([]);
  protected readonly reviews = signal<Review[]>([]);
  protected readonly selectedVariantId = signal<number | null>(null);
  protected readonly selectedImageIndex = signal(0);
  protected readonly quantity = signal(1);
  protected readonly addingToCart = signal(false);

  protected readonly reviewForm = { rating: 5, title: '', comment: '' };
  protected readonly submittingReview = signal(false);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');
      if (slug) this.loadProduct(slug);
    });
  }

  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.selectedImageIndex.set(0);
    this.quantity.set(1);

    this.productService.getBySlug(slug).subscribe({
      next: product => {
        this.product.set(product);
        this.selectedVariantId.set(product.variants.find(v => v.isDefault)?.id ?? null);
        this.loading.set(false);
        const description = product.metaDescription || product.shortDescription || `Order ${product.name} online, fresh flowers delivered across the UAE.`;
        this.seo.set({
          title: product.metaTitle || product.name,
          description,
          image: mediaUrl(product.images[0]?.url),
          type: 'product'
        });
        this.seo.setJsonLd({
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          description,
          image: product.images.map(img => mediaUrl(img.url)),
          sku: product.sku,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'AED',
            price: (product.discountPrice ? Number(product.discountPrice) : Number(product.basePrice)).toFixed(2),
            // Every bouquet is made to order rather than pulled from fixed
            // inventory, so it's always available to purchase.
            availability: 'https://schema.org/InStock'
          },
          ...(product.reviewCount > 0
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: Number(product.avgRating).toFixed(1),
                  reviewCount: product.reviewCount
                }
              }
            : {})
        });

        this.productService.related(slug, 8).subscribe({ next: items => this.related.set(items), error: () => undefined });
        this.reviewService.forProduct(slug, { limit: 20 }).subscribe({
          next: ({ items }) => this.reviews.set(items),
          error: () => undefined
        });
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      }
    });
  }

  get primaryImageUrl(): string {
    const product = this.product();
    if (!product || !product.images.length) return IMAGE_FALLBACK;
    const index = Math.min(this.selectedImageIndex(), product.images.length - 1);
    return mediaUrl(product.images[index]?.url, undefined, 900);
  }

  imageUrl(url: string): string {
    return mediaUrl(url, undefined, 150);
  }

  get selectedVariant() {
    const product = this.product();
    if (!product) return null;
    return product.variants.find(v => v.id === this.selectedVariantId()) ?? null;
  }

  get effectivePrice(): number {
    const product = this.product();
    if (!product) return 0;
    const base = product.discountPrice ? Number(product.discountPrice) : Number(product.basePrice);
    const adjustment = this.selectedVariant ? Number(this.selectedVariant.priceAdjustment) : 0;
    return Math.round((base + adjustment) * 100) / 100;
  }

  incrementQty(): void {
    this.quantity.update(q => q + 1);
  }

  decrementQty(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  addToCart(): void {
    const product = this.product();
    if (!product) return;

    this.addingToCart.set(true);
    this.cartService.addItem(product.id, this.quantity(), this.selectedVariantId() ?? undefined).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.notifications.success(`${product.name} added to cart`);
      },
      error: (err: HttpErrorResponse) => {
        this.addingToCart.set(false);
        this.notifications.error(formatApiError(err, 'Could not add this item to your cart. Please try again.'));
      }
    });
  }

  get isWishlisted(): boolean {
    const product = this.product();
    return product ? this.wishlistService.isWishlisted(product.id) : false;
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/account/login'], { queryParams: { redirect: this.router.url } });
      return;
    }
    if (this.isWishlisted) {
      this.wishlistService.remove(product.id).subscribe({
        error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not update your wishlist. Please try again.'))
      });
    } else {
      this.wishlistService.add(product.id).subscribe({
        error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not update your wishlist. Please try again.'))
      });
    }
  }

  submitReview(): void {
    const product = this.product();
    if (!product) return;
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/account/login'], { queryParams: { redirect: this.router.url } });
      return;
    }

    this.submittingReview.set(true);
    this.reviewService
      .create({
        productId: product.id,
        rating: this.reviewForm.rating,
        title: this.reviewForm.title || undefined,
        comment: this.reviewForm.comment || undefined
      })
      .subscribe({
        next: () => {
          this.submittingReview.set(false);
          this.reviewForm.title = '';
          this.reviewForm.comment = '';
          this.reviewForm.rating = 5;
          this.notifications.success('Thanks for your review! It will appear once approved.');
        },
        error: (err: HttpErrorResponse) => {
          this.submittingReview.set(false);
          this.notifications.error(formatApiError(err, 'Could not submit your review. Please try again.'));
        }
      });
  }

  starsArray(rating: number): number[] {
    return Array(Math.round(rating)).fill(0);
  }
}
