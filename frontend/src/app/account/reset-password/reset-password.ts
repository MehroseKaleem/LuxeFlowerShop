import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

const PASSWORD_PATTERN = /^(?=.*\d).{8,}$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly success = signal(false);
  private token = this.route.snapshot.paramMap.get('token') || '';

  protected form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.auth.resetPassword(this.token, this.form.getRawValue().password).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        setTimeout(() => this.router.navigateByUrl('/account/login'), 2000);
      },
      error: () => {
        this.submitting.set(false);
        this.errorMessage.set('This reset link is invalid or has expired. Please request a new one.');
      }
    });
  }
}
