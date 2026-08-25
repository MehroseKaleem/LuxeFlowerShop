import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { formatApiError } from '../../shared/utils/api-error.util';

const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const PASSWORD_PATTERN = /^(?=.*\d).{8,}$/;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  protected auth = inject(AuthService);
  private userService = inject(UserService);
  private notifications = inject(NotificationService);

  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);

  protected profileForm = this.fb.nonNullable.group({
    name: [this.auth.user()?.name || '', [Validators.required, Validators.maxLength(120)]],
    phone: [this.auth.user()?.phone || '', [Validators.required, Validators.pattern(PHONE_PATTERN)]]
  });

  protected passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
  });

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.savingProfile.set(true);
    this.userService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: user => {
        this.auth.setUser(user);
        this.savingProfile.set(false);
        this.notifications.success('Profile updated');
      },
      error: (err: HttpErrorResponse) => {
        this.savingProfile.set(false);
        this.notifications.error(formatApiError(err, 'Could not update your profile. Please try again.'));
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.notifications.success('Password changed');
      },
      error: (err: HttpErrorResponse) => {
        this.savingPassword.set(false);
        this.notifications.error(formatApiError(err, 'Could not change your password. Please check your current password and try again.'));
      }
    });
  }
}
