import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { combineLatest } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { ProductListItem, ProductQuery } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  templateUrl: './shop.html',
  styleUrl: './shop.scss'
})
export class ShopComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  protected readonly loading = signal(true);
  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly activeCategory = signal<Category | null>(null);
  protected readonly searchTerm = signal<string | null>(null);
  protected readonly sort = signal<SortOption>('newest');
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly total = signal(0);

  ngOnInit(): void {
    this.categoryService.list().subscribe({ next: cats => this.categories.set(cats), error: () => undefined });

    combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(([params, query]) => {
      const slug = params.get('slug');
      const q = query.get('q');
      const categorySlug = query.get('category');
      const sort = (query.get('sort') as SortOption) || 'newest';
      const page = Number(query.get('page')) || 1;

      this.searchTerm.set(q);
      this.sort.set(sort);
      this.page.set(page);

      if (slug) {
        this.categoryService.getBySlug(slug).subscribe({
          next: category => {
            this.activeCategory.set(category);
            this.titleService.setTitle(`${category.name} | Karaz Flowers`);
            this.metaService.updateTag({
              name: 'description',
              content: category.description || `Shop our ${category.name} collection at Karaz Flowers — fresh flowers delivered across the UAE.`
            });
          },
          error: () => this.activeCategory.set(null)
        });
        this.fetchProducts({ category: slug, sort, page });
      } else {
        this.activeCategory.set(null);
        this.titleService.setTitle(q ? `Search: ${q} | Karaz Flowers` : 'Shop | Karaz Flowers');
        this.fetchProducts({ category: categorySlug || undefined, search: q || undefined, sort, page });
      }
    });
  }

  private fetchProducts(opts: { category?: string; search?: string; sort: SortOption; page: number }): void {
    this.loading.set(true);

    const query: ProductQuery = { page: opts.page, limit: 12, category: opts.category, search: opts.search };
    switch (opts.sort) {
      case 'price-low':
        query.sortBy = 'basePrice';
        query.sortOrder = 'asc';
        break;
      case 'price-high':
        query.sortBy = 'basePrice';
        query.sortOrder = 'desc';
        break;
      case 'rating':
        query.sortBy = 'avgRating';
        query.sortOrder = 'desc';
        break;
      default:
        query.sortBy = 'createdAt';
        query.sortOrder = 'desc';
    }

    this.productService.list(query).subscribe({
      next: ({ items, meta }) => {
        this.products.set(items);
        this.totalPages.set(meta.totalPages);
        this.total.set(meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      }
    });
  }

  onSortChange(sort: SortOption): void {
    this.updateQueryParams({ sort, page: 1 });
  }

  goToCategory(slug: string | null): void {
    if (slug) {
      this.router.navigate(['/category', slug]);
    } else {
      this.router.navigate(['/shop']);
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.updateQueryParams({ page });
  }

  private updateQueryParams(patch: Record<string, string | number | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: patch,
      queryParamsHandling: 'merge'
    });
  }

  get pageTitle(): string {
    if (this.activeCategory()) return this.activeCategory()!.name;
    if (this.searchTerm()) return `Search results for "${this.searchTerm()}"`;
    return 'Shop All Flowers';
  }

  get pageDescription(): string {
    if (this.activeCategory()?.description) return this.activeCategory()!.description as string;
    return 'Explore our handcrafted arrangements, made fresh with premium flowers for delivery across the UAE.';
  }
}
