import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { SettingsService } from '../../services/settings.service';
import { NotificationService } from '../../core/services/notification.service';

const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const PASSWORD_PATTERN = /^(?=.*\d).{8,}$/;

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private settingsService = inject(SettingsService);
  private notifications = inject(NotificationService);

  activeTab = signal<'profile' | 'store' | 'security'>('profile');
  savingProfile = signal(false);
  savingStore = signal(false);
  savingPassword = signal(false);
  loadingStore = signal(true);

  profileForm: FormGroup = this.fb.group({
    name: [this.authService.user()?.name || '', Validators.required],
    email: [{ value: this.authService.user()?.email || '', disabled: true }],
    phone: [this.authService.user()?.phone || '', [Validators.required, Validators.pattern(PHONE_PATTERN)]]
  });

  storeForm: FormGroup = this.fb.group({
    CURRENCY: ['AED', Validators.required],
    SHIPPING_FEE: [0, [Validators.required, Validators.min(0)]],
    FREE_SHIPPING_THRESHOLD: [0, [Validators.required, Validators.min(0)]],
    TAX_RATE_PERCENT: [0, [Validators.required, Validators.min(0)]],
    STORE_PHONE: ['', Validators.required],
    STORE_EMAIL: ['', [Validators.required, Validators.email]]
  });

  securityForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
  });

  ngOnInit(): void {
    this.settingsService.adminGet().subscribe({
      next: settings => {
        this.storeForm.patchValue({
          CURRENCY: settings['CURRENCY'],
          SHIPPING_FEE: Number(settings['SHIPPING_FEE']),
          FREE_SHIPPING_THRESHOLD: Number(settings['FREE_SHIPPING_THRESHOLD']),
          TAX_RATE_PERCENT: Number(settings['TAX_RATE_PERCENT']),
          STORE_PHONE: settings['STORE_PHONE'],
          STORE_EMAIL: settings['STORE_EMAIL']
        });
        this.loadingStore.set(false);
      },
      error: () => this.loadingStore.set(false)
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.userService.updateProfile({ name: this.profileForm.value.name, phone: this.profileForm.value.phone }).subscribe({
      next: user => {
        this.authService.setUser(user);
        this.savingProfile.set(false);
        this.notifications.success('Profile updated');
      },
      error: () => this.savingProfile.set(false)
    });
  }

  saveStore(): void {
    if (this.storeForm.invalid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.savingStore.set(true);
    const value = this.storeForm.value;
    this.settingsService
      .adminUpdate({
        CURRENCY: value.CURRENCY,
        SHIPPING_FEE: String(value.SHIPPING_FEE),
        FREE_SHIPPING_THRESHOLD: String(value.FREE_SHIPPING_THRESHOLD),
        TAX_RATE_PERCENT: String(value.TAX_RATE_PERCENT),
        STORE_PHONE: value.STORE_PHONE,
        STORE_EMAIL: value.STORE_EMAIL
      })
      .subscribe({
        next: () => {
          this.savingStore.set(false);
          this.notifications.success('Store settings updated');
        },
        error: () => this.savingStore.set(false)
      });
  }

  changePassword(): void {
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.securityForm.value;
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.securityForm.reset();
        this.notifications.success('Password updated');
      },
      error: () => this.savingPassword.set(false)
    });
  }
}
