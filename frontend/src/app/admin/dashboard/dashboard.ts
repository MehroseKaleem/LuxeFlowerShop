import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { OrderService } from '../../services/order.service';
import { ReviewService } from '../../services/review.service';
import { ContactService } from '../../services/contact.service';
import { OrderStatus } from '../../models/order.model';

const STATUS_COLORS: Record<string, string> = {
  DELIVERED: '#10b981',
  PROCESSING: '#d4a853',
  PENDING: '#f59e0b',
  CANCELLED: '#ef4444',
  CONFIRMED: '#3b82f6',
  SHIPPED: '#8b5cf6',
  OUT_FOR_DELIVERY: '#06b6d4',
  REFUNDED: '#94a3b8'
};

interface RecentOrderRow {
  id: string;
  customer: string;
  total: number;
  status: string;
  date: Date;
}

interface RecentReviewRow {
  id: number;
  name: string;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  providers: [DatePipe, CurrencyPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private orderService = inject(OrderService);
  private reviewService = inject(ReviewService);
  private contactService = inject(ContactService);

  today = new Date();

  totalProducts = signal(0);
  totalOrders = signal(0);
  totalRevenue = signal(0);
  pendingReviews = signal(0);
  totalCustomers = signal(0);
  unreadMessages = signal(0);

  recentOrders = signal<RecentOrderRow[]>([]);
  recentReviews = signal<RecentReviewRow[]>([]);

  salesTrend = signal<{ label: string; amount: number }[]>([]);
  maxRevenue = computed(() => Math.max(...this.salesTrend().map(m => m.amount), 1));

  orderStatusStats = signal<{ status: string; count: number; percent: number; color: string }[]>([]);

  ngOnInit() {
    this.dashboardService.overview().subscribe({
      next: overview => {
        this.totalProducts.set(overview.totalProducts);
        this.totalOrders.set(overview.totalOrders);
        this.totalRevenue.set(overview.totalRevenue);
        this.totalCustomers.set(overview.totalCustomers);
      },
      error: () => undefined
    });

    this.dashboardService.sales(14).subscribe({
      next: points => {
        this.salesTrend.set(
          points.map(p => ({
            label: new Date(p.date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' }),
            amount: p.revenue
          }))
        );
      },
      error: () => undefined
    });

    this.dashboardService.orderStatusBreakdown().subscribe({
      next: breakdown => {
        const total = breakdown.reduce((sum, b) => sum + b.count, 0) || 1;
        this.orderStatusStats.set(
          breakdown.map(b => ({
            status: b.status,
            count: b.count,
            percent: Math.round((b.count / total) * 1000) / 10,
            color: STATUS_COLORS[b.status] || '#94a3b8'
          }))
        );
      },
      error: () => undefined
    });

    this.orderService.adminList({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }).subscribe({
      next: ({ items }) => {
        this.recentOrders.set(
          items.map(o => ({
            id: o.orderNumber,
            customer: o.user?.name || o.customerEmail,
            total: Number(o.total),
            status: o.status,
            date: new Date(o.createdAt)
          }))
        );
      },
      error: () => undefined
    });

    this.reviewService.adminList({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' }).subscribe({
      next: ({ items }) => {
        this.recentReviews.set(
          items.map(r => ({ id: r.id, name: r.user?.name || 'Customer', rating: r.rating, comment: r.comment || '' }))
        );
      },
      error: () => undefined
    });

    this.reviewService.adminList({ isApproved: 'false', limit: 1 }).subscribe({
      next: ({ meta }) => this.pendingReviews.set(meta.total),
      error: () => undefined
    });

    this.contactService.adminList({ isRead: 'false', limit: 1 }).subscribe({
      next: ({ meta }) => this.unreadMessages.set(meta.total),
      error: () => undefined
    });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase() as Lowercase<OrderStatus>) {
      case 'delivered':
        return 'status-success';
      case 'processing':
      case 'confirmed':
      case 'shipped':
      case 'out_for_delivery':
        return 'status-accent';
      case 'pending':
        return 'status-warning';
      case 'cancelled':
      case 'refunded':
        return 'status-danger';
      default:
        return 'status-default';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}
