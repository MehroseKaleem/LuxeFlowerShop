import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { CartSessionService } from '../../core/services/cart-session.service';

@Component({
  selector: 'app-account-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class AccountLoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private cart = inject(CartService);
  private cartSession = inject(CartSessionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);
    const { identifier, password } = this.form.getRawValue();

    this.auth.login(identifier, password).subscribe({
      next: () => {
        const guestSessionId = this.cartSession.getOrCreateSessionId();
        const finishLogin = () => {
          this.submitting.set(false);
          const redirect = this.route.snapshot.queryParamMap.get('redirect');
          this.router.navigateByUrl(redirect || '/account');
        };

        if (guestSessionId) {
          this.cart.mergeGuestCart(guestSessionId).subscribe({ next: finishLogin, error: finishLogin });
        } else {
          finishLogin();
        }
      },
      error: err => {
        this.submitting.set(false);
        this.errorMessage.set(err.status === 401 ? 'Invalid email/phone or password.' : 'Something went wrong. Please try again.');
      }
    });
  }
}
