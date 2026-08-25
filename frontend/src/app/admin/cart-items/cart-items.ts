import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminCartService } from '../../services/admin-cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdminCartSummary } from '../../models/admin-cart.model';
import { formatApiError } from '../../shared/utils/api-error.util';

@Component({
  selector: 'app-admin-cart-items',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-items.html',
  styleUrl: './cart-items.scss'
})
export class CartItemsComponent implements OnInit {
  private adminCartService = inject(AdminCartService);
  private notifications = inject(NotificationService);

  carts = signal<AdminCartSummary[]>([]);
  loading = signal(true);
  searchQuery = signal<string>('');
  abandonedDaysFilter = signal<number | null>(null);
  expandedCartId = signal<number | null>(null);

  filteredCarts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.carts();
    return this.carts().filter(
      cart =>
        (cart.user?.name || '').toLowerCase().includes(query) ||
        (cart.user?.email || '').toLowerCase().includes(query) ||
        cart.items.some(i => (i.productName || '').toLowerCase().includes(query))
    );
  });

  totalItems = computed(() => this.carts().reduce((sum, c) => sum + c.itemsCount, 0));
  potentialRevenue = computed(() => this.carts().reduce((sum, c) => sum + c.estimatedTotal, 0));
  uniqueCustomers = computed(() => this.carts().length);

  ngOnInit() {
    this.loadCarts();
  }

  loadCarts() {
    this.loading.set(true);
    this.adminCartService.list({ limit: 100, abandonedDays: this.abandonedDaysFilter() || undefined }).subscribe({
      next: ({ items }) => {
        this.carts.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  toggleAbandonedFilter(): void {
    this.abandonedDaysFilter.set(this.abandonedDaysFilter() === 7 ? null : 7);
    this.loadCarts();
  }

  toggleExpand(id: number): void {
    this.expandedCartId.set(this.expandedCartId() === id ? null : id);
  }

  deleteCart(id: number) {
    if (!confirm('Clear this cart?')) return;
    this.adminCartService.delete(id).subscribe({
      next: () => {
        this.notifications.success('Cart cleared');
        this.loadCarts();
      },
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not clear the cart. Please try again.'))
    });
  }
}
