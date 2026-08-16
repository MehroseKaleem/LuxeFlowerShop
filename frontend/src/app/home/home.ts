import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HeroComponent } from '../components/hero/hero';
import { CarouselComponent } from '../shared/components/carousel/carousel';
import { ProductCardComponent } from '../shared/components/product-card/product-card';
import { FeaturedCoverflowComponent } from '../shared/components/featured-coverflow/featured-coverflow';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { ReviewService } from '../services/review.service';
import { BannerService } from '../services/banner.service';
import { Category } from '../models/category.model';
import { ProductListItem } from '../models/product.model';
import { Review } from '../models/review.model';
import { mediaUrl } from '../shared/utils/media.util';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { Tilt3dDirective } from '../shared/directives/tilt-3d.directive';

interface CollectionCard {
  title: string;
  image: string;
  link: string;
}

interface CategorySection {
  title: string;
  link: string;
  products: ProductListItem[];
}

interface ValueProp {
  icon: 'flower' | 'truck' | 'shield' | 'support';
  title: string;
  text: string;
}

const MAX_HOME_CATEGORY_SECTIONS = 6;
const ABOUT_SLIDE_MS = 4200;
const TESTIMONIAL_SLIDE_MS = 5000;

const FALLBACK_ABOUT_SLIDES = ['/bouquets.jpeg', '/flowers.jpeg', '/julietbouquet.jpeg', '/mixedflower.jpeg', '/rosesinbox.jpeg'];

const VALUE_PROPS: ValueProp[] = [
  { icon: 'flower', title: 'Hand-Arranged Freshness', text: 'Every bouquet is hand-selected and arranged by experienced florists using fresh blooms.' },
  { icon: 'truck', title: 'Same-Day UAE Delivery', text: 'Order today, delivered today — fast, careful delivery available across the UAE.' },
  { icon: 'shield', title: 'Secure Checkout', text: 'Pay safely with Cash on Delivery or card — your details are always protected.' },
  { icon: 'support', title: 'Dedicated Support', text: 'Real support for every order, every time, from browsing to delivery.' }
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeroComponent,
    CarouselComponent,
    ProductCardComponent,
    FeaturedCoverflowComponent,
    ScrollRevealDirective,
    Tilt3dDirective
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private reviewService = inject(ReviewService);
  private bannerService = inject(BannerService);
  private platformId = inject(PLATFORM_ID);

  protected readonly loading = signal(true);
  protected readonly featuredProducts = signal<ProductListItem[]>([]);
  protected readonly collectionsCards = signal<CollectionCard[]>([]);
  protected readonly categorySections = signal<CategorySection[]>([]);
  protected readonly testimonials = signal<Review[]>([]);
  protected readonly valueProps = VALUE_PROPS;

  protected readonly aboutSlides = signal<string[]>(FALLBACK_ABOUT_SLIDES);
  protected readonly aboutIndex = signal(0);
  protected readonly testimonialIndex = signal(0);
  private aboutTimer: ReturnType<typeof setInterval> | null = null;
  private testimonialTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.bannerService.list('HOME_SECONDARY').subscribe({
      next: banners => {
        if (banners.length) {
          this.aboutSlides.set(banners.map(b => mediaUrl(b.imageUrl)));
          this.aboutIndex.set(0);
        }
      },
      error: () => undefined
    });

    if (isPlatformBrowser(this.platformId)) {
      this.aboutTimer = setInterval(() => {
        this.aboutIndex.update(i => (i + 1) % this.aboutSlides().length);
      }, ABOUT_SLIDE_MS);
    }

    this.reviewService.featured(6).subscribe({
      next: reviews => {
        this.testimonials.set(reviews);
        if (isPlatformBrowser(this.platformId) && reviews.length > 1) {
          this.testimonialTimer = setInterval(() => this.nextTestimonial(), TESTIMONIAL_SLIDE_MS);
        }
      },
      error: () => undefined
    });

    this.categoryService.list().subscribe({
      next: categories => {
        this.collectionsCards.set(
          categories.map(c => ({
            title: c.name,
            image: mediaUrl(c.image, '/flowers.jpeg'),
            link: `/category/${c.slug}`
          }))
        );
        this.loadSections(categories);
      },
      error: () => this.loading.set(false)
    });

    this.productService.featured(10).subscribe({
      next: products => this.featuredProducts.set(products),
      error: () => undefined
    });
  }

  private loadSections(categories: Category[]): void {
    const totalProductCount = Math.max(...categories.map(c => c._count?.products ?? 0), 0);
    // Skip "catch-all" categories that hold every product — they'd just
    // duplicate the featured/other sections with no distinct content.
    const distinctCategories = categories
      .filter(c => (c._count?.products ?? 0) > 0 && (c._count?.products ?? 0) < totalProductCount)
      .slice(0, MAX_HOME_CATEGORY_SECTIONS);

    const usableCategories = distinctCategories.length ? distinctCategories : categories.slice(0, MAX_HOME_CATEGORY_SECTIONS);

    if (!usableCategories.length) {
      this.loading.set(false);
      return;
    }

    forkJoin(
      usableCategories.map(category => this.productService.list({ category: category.slug, limit: 10 }))
    ).subscribe({
      next: results => {
        this.categorySections.set(
          usableCategories
            .map((category, i) => ({
              title: category.name,
              link: `/category/${category.slug}`,
              products: results[i].items
            }))
            .filter(section => section.products.length > 0)
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  protected stars(rating: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  protected goToAbout(index: number): void {
    this.aboutIndex.set(index);
  }

  protected nextTestimonial(): void {
    const n = this.testimonials().length;
    if (!n) return;
    this.testimonialIndex.update(i => (i + 1) % n);
  }

  protected prevTestimonial(): void {
    const n = this.testimonials().length;
    if (!n) return;
    this.testimonialIndex.update(i => (i - 1 + n) % n);
  }

  protected goToTestimonial(index: number): void {
    this.testimonialIndex.set(index);
  }

  ngOnDestroy(): void {
    if (this.aboutTimer) clearInterval(this.aboutTimer);
    if (this.testimonialTimer) clearInterval(this.testimonialTimer);
  }
}
