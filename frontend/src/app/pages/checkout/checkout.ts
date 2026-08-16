import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { StripeLoaderService } from '../../core/services/stripe-loader.service';
import { Address } from '../../models/user.model';
import { CreateOrderPayload, Order, PaymentMethod } from '../../models/order.model';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AedCurrencyPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss'
})
export class CheckoutComponent implements OnInit {
  protected cartService = inject(CartService);
  private orderService = inject(OrderService);
  private paymentService = inject(PaymentService);
  private userService = inject(UserService);
  protected auth = inject(AuthService);
  private notifications = inject(NotificationService);
  private stripeLoader = inject(StripeLoaderService);
  private router = inject(Router);

  protected readonly emirates = EMIRATES;
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly savedAddresses = signal<Address[]>([]);
  protected readonly selectedAddressId = signal<number | null>(null);
  protected readonly useNewAddress = signal(false);
  protected readonly stripeEnabled = !!environment.stripePublishableKey;

  protected readonly awaitingCardPayment = signal(false);
  protected readonly payingWithCard = signal(false);
  protected readonly cardError = signal<string | null>(null);
  protected pendingOrderNumber: string | null = null;
  private pendingOrder: Order | null = null;
  private pendingClientSecret: string | null = null;
  private stripe: any = null;
  private cardElement: any = null;

  protected form = {
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    emirate: EMIRATES[0],
    postalCode: '',
    guestEmail: '',
    guestPhone: '',
    deliveryDate: '',
    deliveryTimeSlot: '',
    notes: '',
    paymentMethod: 'COD' as PaymentMethod
  };

  ngOnInit(): void {
    this.cartService.loadCart().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });

    if (this.auth.isLoggedIn()) {
      this.userService.myAddresses().subscribe({
        next: addresses => {
          this.savedAddresses.set(addresses);
          const defaultAddress = addresses.find(a => a.isDefault) ?? addresses[0];
          if (defaultAddress) {
            this.selectedAddressId.set(defaultAddress.id);
          } else {
            this.useNewAddress.set(true);
          }
        },
        error: () => this.useNewAddress.set(true)
      });
    }
  }

  get cartIsEmpty(): boolean {
    return !this.cartService.cart()?.items?.length;
  }

  submitOrder(): void {
    if (this.cartIsEmpty || this.submitting()) return;

    const payload: CreateOrderPayload = {
      paymentMethod: this.form.paymentMethod,
      deliveryDate: this.form.deliveryDate || undefined,
      deliveryTimeSlot: this.form.deliveryTimeSlot || undefined,
      notes: this.form.notes || undefined
    };

    if (this.auth.isLoggedIn() && !this.useNewAddress() && this.selectedAddressId()) {
      payload.shippingAddressId = this.selectedAddressId()!;
    } else {
      if (!this.form.fullName || !this.form.phone || !this.form.addressLine1 || !this.form.city || !this.form.emirate) {
        this.notifications.error('Please fill in all required address fields.');
        return;
      }
      payload.shippingAddress = {
        fullName: this.form.fullName,
        phone: this.form.phone,
        addressLine1: this.form.addressLine1,
        addressLine2: this.form.addressLine2 || undefined,
        city: this.form.city,
        emirate: this.form.emirate,
        postalCode: this.form.postalCode || undefined,
        country: 'AE'
      };
    }

    if (!this.auth.isLoggedIn()) {
      if (!this.form.guestEmail || !this.form.guestPhone) {
        this.notifications.error('Please provide your email and phone number.');
        return;
      }
      payload.guestEmail = this.form.guestEmail;
      payload.guestPhone = this.form.guestPhone;
    }

    this.submitting.set(true);
    this.orderService.create(payload).subscribe({
      next: order => {
        this.cartService.reset();
        if (order.paymentMethod === 'STRIPE' && this.stripeEnabled) {
          this.pendingOrderNumber = order.orderNumber;
          this.pendingOrder = order;
          this.beginCardPayment(order.orderNumber);
        } else {
          this.submitting.set(false);
          this.router.navigate(['/order-confirmation', order.orderNumber], { state: { order } });
        }
      },
      error: () => this.submitting.set(false)
    });
  }

  private beginCardPayment(orderNumber: string): void {
    this.paymentService.createIntent(orderNumber, this.form.guestEmail || undefined).subscribe({
      next: clientSecret => {
        this.awaitingCardPayment.set(true);
        this.submitting.set(false);
        setTimeout(() => this.mountCardElement(clientSecret), 0);
      },
      error: () => {
        this.submitting.set(false);
        this.notifications.error('Could not start card payment for this order.');
      }
    });
  }

  private async mountCardElement(clientSecret: string): Promise<void> {
    try {
      this.stripe = await this.stripeLoader.load(environment.stripePublishableKey);
      const elements = this.stripe.elements();
      this.cardElement = elements.create('card');
      this.cardElement.mount('#card-element');
      this.pendingClientSecret = clientSecret;
    } catch {
      this.cardError.set('Could not load the card payment form. Please try again.');
    }
  }

  confirmCardPayment(): void {
    if (!this.stripe || !this.cardElement || !this.pendingOrderNumber || !this.pendingClientSecret) return;
    const clientSecret = this.pendingClientSecret;

    this.payingWithCard.set(true);
    this.cardError.set(null);

    this.stripe
      .confirmCardPayment(clientSecret, { payment_method: { card: this.cardElement } })
      .then((result: any) => {
        this.payingWithCard.set(false);
        if (result.error) {
          this.cardError.set(result.error.message || 'Payment failed. Please try again.');
        } else {
          this.router.navigate(['/order-confirmation', this.pendingOrderNumber], {
            state: { order: { ...this.pendingOrder, paymentStatus: 'PAID' } }
          });
        }
      })
      .catch(() => {
        this.payingWithCard.set(false);
        this.cardError.set('Payment failed. Please try again.');
      });
  }
}
