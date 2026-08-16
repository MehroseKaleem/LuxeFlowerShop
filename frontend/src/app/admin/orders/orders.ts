import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order, OrderStatus, ORDER_STATUS_TRANSITIONS } from '../../models/order.model';

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
  }

  refreshOrders() {
    this.loading.set(true);
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

  updateStatus(orderId: number, newStatus: OrderStatus) {
    this.updatingStatus.set(true);
    this.orderService.adminUpdateStatus(orderId, newStatus, this.statusNote() || undefined).subscribe({
      next: () => {
        this.updatingStatus.set(false);
        this.notifications.success('Order status updated');
        this.refreshOrders();
        this.closeStatusModal();
      },
      error: () => this.updatingStatus.set(false)
    });
  }

  markPaid(order: Order): void {
    this.orderService.adminUpdatePaymentStatus(order.id, 'PAID').subscribe({
      next: () => {
        this.notifications.success('Marked as paid');
        this.refreshOrders();
      }
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
