import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { Address } from '../../models/user.model';

const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './addresses.html',
  styleUrl: './addresses.scss'
})
export class AddressesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private notifications = inject(NotificationService);

  protected readonly emirates = EMIRATES;
  protected readonly loading = signal(true);
  protected readonly addresses = signal<Address[]>([]);
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal(false);

  protected form = this.fb.nonNullable.group({
    label: ['Home', Validators.required],
    fullName: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    emirate: [EMIRATES[0], Validators.required],
    postalCode: ['']
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.userService.myAddresses().subscribe({
      next: addresses => {
        this.addresses.set(addresses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openAddForm(): void {
    this.editingId.set(null);
    this.form.reset({ label: 'Home', emirate: EMIRATES[0] });
    this.showForm.set(true);
  }

  openEditForm(address: Address): void {
    this.editingId.set(address.id);
    this.form.reset({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      emirate: address.emirate,
      postalCode: address.postalCode || ''
    });
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.showForm.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = this.form.getRawValue();
    const editingId = this.editingId();
    const request = editingId ? this.userService.updateAddress(editingId, payload) : this.userService.addAddress(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.notifications.success(editingId ? 'Address updated' : 'Address added');
        this.load();
      },
      error: () => this.saving.set(false)
    });
  }

  deleteAddress(id: number): void {
    this.userService.deleteAddress(id).subscribe({
      next: () => {
        this.notifications.success('Address removed');
        this.load();
      }
    });
  }

  setDefault(id: number): void {
    this.userService.setDefaultAddress(id).subscribe({ next: () => this.load() });
  }
}
