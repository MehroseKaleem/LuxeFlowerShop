import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { StripeLoaderService } from '../../core/services/stripe-loader.service';
import { SeoService } from '../../core/services/seo.service';
import { Address, AddressInput } from '../../models/user.model';
import { CreateOrderPayload, Order, PaymentMethod } from '../../models/order.model';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';
import { formatApiError } from '../../shared/utils/api-error.util';

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
  private seo = inject(SeoService);

  protected readonly emirates = EMIRATES;
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly savedAddresses = signal<Address[]>([]);
  protected readonly selectedAddressId = signal<number | null>(null);
  protected readonly saveNewAddress = signal(false);
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
    this.seo.set({ title: 'Checkout', description: 'Complete your Luxeflower order — secure checkout with Cash on Delivery or card.', noindex: true });

    this.cartService.loadCart().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });

    const user = this.auth.user();
    if (user) {
      // Pre-fill with the account's name/phone so a logged-in customer
      // never has to retype what we already have.
      this.form.fullName = user.name;
      this.form.phone = user.phone;

      this.userService.myAddresses().subscribe({
        next: addresses => {
          this.savedAddresses.set(addresses);
          const defaultAddress = addresses.find(a => a.isDefault) ?? addresses[0];
          if (defaultAddress) {
            // Pre-fill the actual editable fields with their saved address,
            // not just a read-only card - they can tweak anything before
            // placing the order.
            this.applySavedAddress(defaultAddress);
          } else {
            // First order - default to saving whatever they enter.
            this.saveNewAddress.set(true);
          }
        },
        error: () => undefined
      });
    }
  }

  applySavedAddress(address: Address): void {
    this.selectedAddressId.set(address.id);
    this.form.fullName = address.fullName;
    this.form.phone = address.phone;
    this.form.addressLine1 = address.addressLine1;
    this.form.addressLine2 = address.addressLine2 || '';
    this.form.city = address.city;
    this.form.emirate = address.emirate;
    this.form.postalCode = address.postalCode || '';
    // Already saved under this account - no need to save it again unless
    // they change something.
    this.saveNewAddress.set(false);
  }

  onSavedAddressChange(addressId: string): void {
    const address = this.savedAddresses().find(a => a.id === Number(addressId));
    if (address) this.applySavedAddress(address);
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

    if (!this.form.fullName || !this.form.phone || !this.form.addressLine1 || !this.form.city || !this.form.emirate) {
      this.notifications.error('Please fill in all required address fields.');
      return;
    }
    const addressFields = {
      fullName: this.form.fullName,
      phone: this.form.phone,
      addressLine1: this.form.addressLine1,
      addressLine2: this.form.addressLine2 || undefined,
      city: this.form.city,
      emirate: this.form.emirate,
      postalCode: this.form.postalCode || undefined,
      country: 'AE'
    };
    payload.shippingAddress = addressFields;

    let newAddressToSave: AddressInput | null = null;
    if (this.auth.isLoggedIn() && this.saveNewAddress()) {
      newAddressToSave = {
        label: 'Home',
        ...addressFields,
        addressLine2: addressFields.addressLine2 ?? null,
        postalCode: addressFields.postalCode ?? null
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
        if (newAddressToSave) {
          // Fire-and-forget - don't let an address-book failure block an
          // order that already succeeded.
          this.userService.addAddress(newAddressToSave).subscribe({ error: () => undefined });
        }
        if (order.paymentMethod === 'STRIPE' && this.stripeEnabled) {
          this.pendingOrderNumber = order.orderNumber;
          this.pendingOrder = order;
          this.beginCardPayment(order.orderNumber);
        } else {
          this.submitting.set(false);
          this.router.navigate(['/order-confirmation', order.orderNumber], { state: { order } });
        }
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.notifications.error(formatApiError(err, 'Could not place your order. Please check your details and try again.'));
      }
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
