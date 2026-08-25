import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { User } from '../../models/user.model';
import { Order } from '../../models/order.model';
import { formatApiError } from '../../shared/utils/api-error.util';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.scss'
})
export class CustomersComponent implements OnInit {
  private userService = inject(UserService);
  private orderService = inject(OrderService);
  private notifications = inject(NotificationService);

  customers = signal<User[]>([]);
  total = signal(0);
  loading = signal(true);
  searchQuery = signal<string>('');

  selectedCustomer = signal<User | null>(null);
  customerOrders = signal<Order[]>([]);
  loadingDetails = signal(false);

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.userService.adminList({ role: 'CUSTOMER', limit: 100, search: this.searchQuery() || undefined }).subscribe({
      next: ({ items, meta }) => {
        this.customers.set(items);
        this.total.set(meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  search(): void {
    this.loadCustomers();
  }

  get totalSpent(): number {
    return this.customerOrders().reduce((sum, o) => sum + Number(o.total), 0);
  }

  viewDetails(customer: User) {
    this.selectedCustomer.set(customer);
    this.loadingDetails.set(true);
    this.orderService.adminList({ search: customer.email, limit: 100 }).subscribe({
      next: ({ items }) => {
        this.customerOrders.set(items);
        this.loadingDetails.set(false);
      },
      error: () => this.loadingDetails.set(false)
    });
  }

  closeDetails() {
    this.selectedCustomer.set(null);
    this.customerOrders.set([]);
  }

  toggleStatus(customer: User): void {
    this.userService.adminSetStatus(customer.id, !customer.isActive).subscribe({
      next: updated => {
        this.selectedCustomer.set(updated);
        this.customers.update(list => list.map(c => (c.id === updated.id ? updated : c)));
        this.notifications.success(updated.isActive ? 'Account activated' : 'Account deactivated');
      },
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not update the customer status. Please try again.'))
    });
  }
}
