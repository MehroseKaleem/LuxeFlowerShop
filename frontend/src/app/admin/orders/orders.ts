import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { interval, startWith } from 'rxjs';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus, ORDER_STATUS_TRANSITIONS } from '../../models/order.model';
import { formatApiError } from '../../shared/utils/api-error.util';

const POLL_INTERVAL_MS = 15000;

const ALL_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED'
];

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class OrdersComponent implements OnInit {
  private orderService = inject(OrderService);
  private notifications = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

  readonly statuses = ALL_STATUSES;

  orders = signal<Order[]>([]);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  loading = signal(true);

  searchQuery = signal<string>('');
  statusFilter = signal<OrderStatus | 'all'>('all');

  expandedOrderId = signal<number | null>(null);
  showStatusModal = signal<boolean>(false);
  selectedOrder = signal<Order | null>(null);
  statusNote = signal('');
  updatingStatus = signal(false);

  ngOnInit() {
    this.refreshOrders();

    // Auto-refresh so newly placed orders appear without a manual reload.
    // Skipped while the status modal is open so we don't yank the list out
    // from under an admin mid-edit.
    interval(POLL_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.showStatusModal()) this.refreshOrders({ silent: true });
      });
  }

  refreshOrders(opts: { silent?: boolean } = {}) {
    if (!opts.silent) this.loading.set(true);
    this.orderService
      .adminList({
        page: this.page(),
        limit: 20,
        status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
        search: this.searchQuery() || undefined
      })
      .subscribe({
        next: ({ items, meta }) => {
          this.orders.set(items);
          this.total.set(meta.total);
          this.totalPages.set(meta.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  applyFilters(): void {
    this.page.set(1);
    this.refreshOrders();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.page.set(page);
    this.refreshOrders();
  }

  toggleOrderDetails(id: number) {
    this.expandedOrderId.set(this.expandedOrderId() === id ? null : id);
  }

  openStatusModal(order: Order) {
    this.selectedOrder.set(order);
    this.statusNote.set('');
    this.showStatusModal.set(true);
  }

  closeStatusModal() {
    this.showStatusModal.set(false);
    this.selectedOrder.set(null);
  }

  validNextStatuses(order: Order): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[order.status] || [];
  }

  private patchOrder(updated: Order): void {
    this.orders.update(list => list.map(o => (o.id === updated.id ? updated : o)));
  }

  updateStatus(orderId: number, newStatus: OrderStatus) {
    this.updatingStatus.set(true);
    this.orderService.adminUpdateStatus(orderId, newStatus, this.statusNote() || undefined).subscribe({
      next: updatedOrder => {
        this.updatingStatus.set(false);
        this.notifications.success('Order status updated');
        // Patch the row in place instead of a full silent refetch - the
        // API already gave us the updated order, so there's no reason to
        // wait on another round-trip for the UI to reflect it.
        this.patchOrder(updatedOrder);
        this.closeStatusModal();
      },
      error: (err: HttpErrorResponse) => {
        this.updatingStatus.set(false);
        this.notifications.error(formatApiError(err, 'Could not update the order status. Please try again.'));
      }
    });
  }

  markPaid(order: Order): void {
    this.orderService.adminUpdatePaymentStatus(order.id, 'PAID').subscribe({
      next: updatedOrder => {
        this.notifications.success('Marked as paid');
        this.patchOrder(updatedOrder);
      },
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not update the payment status. Please try again.'))
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAddress(order: Order): string {
    const addr = order.shippingAddress;
    if (!addr) return '';
    return [addr.fullName, addr.addressLine1, addr.addressLine2, addr.city, addr.emirate].filter(Boolean).join(', ');
  }

  getTotalItems(order: Order): number {
    if (!order.items) return 0;
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
