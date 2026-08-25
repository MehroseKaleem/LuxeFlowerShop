import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule, RouterLink, AedCurrencyPipe],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.scss'
})
export class OrderConfirmationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  protected auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly order = signal<Order | null>(null);
  protected readonly orderNumber = signal('');
  protected readonly detailsUnavailable = signal(false);

  ngOnInit(): void {
    const orderNumber = this.route.snapshot.paramMap.get('orderNumber') || '';
    this.orderNumber.set(orderNumber);

    const stateOrder = (this.router.getCurrentNavigation()?.extras.state?.['order'] ??
      (history.state && history.state['order'])) as Order | undefined;

    if (stateOrder) {
      this.order.set(stateOrder);
      this.loading.set(false);
      return;
    }

    if (this.auth.isLoggedIn()) {
      this.orderService.getByOrderNumber(orderNumber).subscribe({
        next: order => {
          this.order.set(order);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.detailsUnavailable.set(true);
        }
      });
    } else {
      this.loading.set(false);
      this.detailsUnavailable.set(true);
    }
  }
}
