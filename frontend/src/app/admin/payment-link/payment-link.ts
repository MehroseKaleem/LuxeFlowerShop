import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { OrderService } from '../../services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { Order } from '../../models/order.model';
import { formatApiError } from '../../shared/utils/api-error.util';

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

@Component({
  selector: 'app-admin-payment-link',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './payment-link.html',
  styleUrl: './payment-link.scss'
})
export class PaymentLinkComponent {
  private orderService = inject(OrderService);
  private notifications = inject(NotificationService);
  private fb = inject(FormBuilder);

  protected readonly emirates = EMIRATES;
  protected readonly submitting = signal(false);
  protected readonly result = signal<{ order: Order; paymentLinkUrl: string } | null>(null);
  protected readonly copied = signal(false);

  form: FormGroup = this.fb.group({
    customerName: ['', Validators.required],
    customerEmail: ['', [Validators.required, Validators.email]],
    customerPhone: ['', Validators.required],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    emirate: [EMIRATES[0], Validators.required],
    postalCode: [''],
    deliveryDate: [''],
    deliveryTimeSlot: [''],
    notes: [''],
    items: this.fb.array([this.newItem()])
  });

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  private newItem(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(0.01)]],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addItem(): void {
    this.items.push(this.newItem());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  itemsSubtotal(): number {
    return this.items.controls.reduce((sum, ctrl) => {
      const price = Number(ctrl.get('price')?.value) || 0;
      const quantity = Number(ctrl.get('quantity')?.value) || 0;
      return sum + price * quantity;
    }, 0);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.error('Please fill in every required field before generating the link.');
      return;
    }

    const value = this.form.value;
    this.submitting.set(true);
    this.orderService
      .adminCreateManualOrder({
        customerEmail: value.customerEmail,
        customerPhone: value.customerPhone,
        items: (value.items as { name: string; price: number; quantity: number }[]).map(item => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
        shippingAddress: {
          fullName: value.customerName,
          phone: value.customerPhone,
          addressLine1: value.addressLine1,
          addressLine2: value.addressLine2 || undefined,
          city: value.city,
          emirate: value.emirate,
          postalCode: value.postalCode || undefined
        },
        deliveryDate: value.deliveryDate || undefined,
        deliveryTimeSlot: value.deliveryTimeSlot || undefined,
        notes: value.notes || undefined
      })
      .subscribe({
        next: res => {
          this.submitting.set(false);
          this.result.set(res);
          this.notifications.success(`Payment link generated for order #${res.order.orderNumber}`);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          this.notifications.error(formatApiError(err, 'Could not generate the payment link. Please try again.'));
        }
      });
  }

  copyLink(): void {
    const url = this.result()?.paymentLinkUrl;
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  whatsappHref(): string {
    const res = this.result();
    if (!res) return '#';
    const phone = res.order.customerPhone.replace(/[^0-9]/g, '');
    const message = `Hi ${res.order.shippingAddress.fullName}, here's your payment link for order #${res.order.orderNumber} (AED ${res.order.total}): ${res.paymentLinkUrl}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  startNew(): void {
    this.result.set(null);
    this.items.clear();
    this.items.push(this.newItem());
    this.form.reset({ emirate: EMIRATES[0] });
  }
}
