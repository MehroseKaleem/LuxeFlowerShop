import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CartSessionService } from '../../core/services/cart-session.service';

const PHONE_PATTERN = /^\+?[0-9]{7,15}$/;
const PASSWORD_PATTERN = /^(?=.*\d).{8,}$/;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private cartSession = inject(CartSessionService);
  private router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        const guestSessionId = this.cartSession.getOrCreateSessionId();
        const finish = () => {
          this.submitting.set(false);
          this.router.navigateByUrl('/account');
        };
        if (guestSessionId) {
          this.cart.mergeGuestCart(guestSessionId).subscribe({ next: finish, error: finish });
        } else {
          finish();
        }
      },
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(
          err.status === 409 ? 'An account with this email or phone already exists.' : 'Something went wrong. Please try again.'
        );
      }
    });
  }
}
