import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CouponService } from '../../services/coupon.service';
import { NotificationService } from '../../core/services/notification.service';
import { Coupon } from '../../models/coupon.model';
import { formatApiError } from '../../shared/utils/api-error.util';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './coupons.html',
  styleUrl: './coupons.scss'
})
export class CouponsComponent implements OnInit {
  private couponService = inject(CouponService);
  private notifications = inject(NotificationService);
  private fb = inject(FormBuilder);

  coupons = signal<Coupon[]>([]);
  total = signal(0);
  loading = signal(true);
  searchQuery = signal('');

  showModal = signal(false);
  editingCoupon = signal<Coupon | null>(null);
  saving = signal(false);

  form: FormGroup = this.fb.group({
    code: ['', Validators.required],
    description: [''],
    discountType: ['PERCENTAGE', Validators.required],
    discountValue: [10, [Validators.required, Validators.min(0.01)]],
    minOrderAmount: [null],
    maxDiscountAmount: [null],
    usageLimit: [null],
    usageLimitPerUser: [1, [Validators.required, Validators.min(1)]],
    expiresAt: ['', Validators.required],
    isActive: [true]
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.couponService.adminList({ limit: 100, search: this.searchQuery() || undefined }).subscribe({
      next: ({ items, meta }) => {
        this.coupons.set(items);
        this.total.set(meta.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  search(): void {
    this.load();
  }

  openAddModal() {
    this.editingCoupon.set(null);
    this.form.reset({ discountType: 'PERCENTAGE', discountValue: 10, usageLimitPerUser: 1, isActive: true });
    this.showModal.set(true);
  }

  openEditModal(coupon: Coupon) {
    this.editingCoupon.set(coupon);
    this.form.patchValue({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      minOrderAmount: coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null,
      maxDiscountAmount: coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null,
      usageLimit: coupon.usageLimit,
      usageLimitPerUser: coupon.usageLimitPerUser,
      expiresAt: coupon.expiresAt.substring(0, 10),
      isActive: coupon.isActive
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingCoupon.set(null);
  }

  save() {
    if (this.form.invalid) return;

    const value = this.form.value;
    const payload: Partial<Coupon> & Record<string, unknown> = {
      code: value.code,
      description: value.description || undefined,
      discountType: value.discountType,
      discountValue: value.discountValue,
      minOrderAmount: value.minOrderAmount || undefined,
      maxDiscountAmount: value.maxDiscountAmount || undefined,
      usageLimit: value.usageLimit || undefined,
      usageLimitPerUser: value.usageLimitPerUser,
      expiresAt: new Date(value.expiresAt).toISOString(),
      isActive: value.isActive
    };

    this.saving.set(true);
    const editing = this.editingCoupon();
    const request = editing ? this.couponService.adminUpdate(editing.id, payload) : this.couponService.adminCreate(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.notifications.success(editing ? 'Coupon updated' : 'Coupon created');
        this.load();
        this.closeModal();
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.notifications.error(formatApiError(err, 'Could not save the coupon. Please try again.'));
      }
    });
  }

  toggle(coupon: Coupon) {
    this.couponService.adminToggle(coupon.id).subscribe({
      next: () => this.load(),
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not update the coupon. Please try again.'))
    });
  }

  delete(coupon: Coupon) {
    if (coupon.usedCount > 0) {
      this.notifications.error('This coupon has already been used and cannot be deleted — deactivate it instead.');
      return;
    }
    if (!confirm('Delete this coupon?')) return;
    this.couponService.adminDelete(coupon.id).subscribe({
      next: () => this.load(),
      error: (err: HttpErrorResponse) => this.notifications.error(formatApiError(err, 'Could not delete the coupon. Please try again.'))
    });
  }

  isExpired(coupon: Coupon): boolean {
    return new Date(coupon.expiresAt) < new Date();
  }
}
