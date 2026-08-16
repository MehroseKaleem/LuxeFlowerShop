import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';

@Component({
  selector: 'app-account-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, AedCurrencyPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.scss'
})
export class AccountOrdersComponent implements OnInit {
  private orderService = inject(OrderService);

  protected readonly loading = signal(true);
  protected readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.orderService.myOrders({ limit: 50 }).subscribe({
      next: ({ items }) => {
        this.orders.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
