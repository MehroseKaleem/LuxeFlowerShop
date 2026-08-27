import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';
import { mediaUrl } from '../../shared/utils/media.util';
import { formatApiError } from '../../shared/utils/api-error.util';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, AedCurrencyPipe, ImgFallbackDirective],
  templateUrl: './products.html',
  styleUrl: './products.scss'
})
export class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private notifications = inject(NotificationService);
  private router = inject(Router);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  loading = signal(true);

  searchQuery = signal<string>('');
  selectedCategory = signal<number | null>(null);
  selectedStatus = signal<'all' | 'active' | 'draft'>('all');
  selectedProducts = signal<Set<number>>(new Set<number>());

  ngOnInit() {
    this.categoryService.list().subscribe({ next: cats => this.categories.set(cats) });
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.productService
      .adminList({
        page: this.page(),
        limit: 20,
        search: this.searchQuery() || undefined,
        categoryId: this.selectedCategory() || undefined,
        isActive: this.selectedStatus() === 'all' ? undefined : this.selectedStatus() === 'active'
      })
      .subscribe({
        next: ({ items, meta }) => {
          this.products.set(items);
          this.total.set(meta.total);
          this.totalPages.set(meta.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.loadData();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.loadData();
  }

  imageUrl(product: Product): string {
    return mediaUrl(product.images?.[0]?.url, undefined, 200);
  }

  getCategoryNames(product: Product): string {
    return product.categories.map(c => c.name).join(', ');
  }

  deleteProduct(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    this.productService.adminDelete(id).subscribe({
      next: () => {
        this.loadData();
        const current = new Set(this.selectedProducts());
        current.delete(id);
        this.selectedProducts.set(current);
      },
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not delete the product. Please try again.'))
    });
  }

  bulkDelete() {
    const ids = Array.from(this.selectedProducts());
    if (!ids.length || !confirm(`Are you sure you want to delete ${ids.length} products?`)) return;

    forkJoin(ids.map(id => this.productService.adminDelete(id))).subscribe({
      next: () => {
        this.loadData();
        this.selectedProducts.set(new Set<number>());
      },
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not delete the selected products. Please try again.'))
    });
  }

  toggleSelect(id: number) {
    const current = new Set(this.selectedProducts());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.selectedProducts.set(current);
  }

  toggleSelectAll() {
    if (this.selectedProducts().size === this.products().length) {
      this.selectedProducts.set(new Set<number>());
    } else {
      this.selectedProducts.set(new Set(this.products().map(p => p.id)));
    }
  }

  navigateToEdit(id: number) {
    this.router.navigate(['/admin/products/edit', id]);
  }

  navigateToAdd() {
    this.router.navigate(['/admin/products/add']);
  }
}
