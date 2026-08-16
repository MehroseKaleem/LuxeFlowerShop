import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HeroCarouselComponent } from '../components/hero-carousel/hero-carousel';
import { ProductCarouselComponent } from '../shared/components/product-carousel/product-carousel';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { Category } from '../models/category.model';
import { ProductListItem } from '../models/product.model';
import { mediaUrl } from '../shared/utils/media.util';

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

const MAX_HOME_CATEGORY_SECTIONS = 6;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, HeroCarouselComponent, ProductCarouselComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);

  protected readonly loading = signal(true);
  protected readonly featuredProducts = signal<ProductListItem[]>([]);
  protected readonly collectionsCards = signal<CollectionCard[]>([]);
  protected readonly categorySections = signal<CategorySection[]>([]);

  ngOnInit(): void {
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
}
