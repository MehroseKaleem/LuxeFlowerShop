import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.set({ title: 'Admin Sign In', description: 'Luxeflower admin panel sign in.', noindex: true });
  }

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required])
  });

  showPassword = signal(false);
  errorMessage = signal('');
  isLoading = signal(false);

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login(email!, password!).subscribe({
      next: ({ user }) => {
        this.isLoading.set(false);
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.authService.clearSession();
          this.errorMessage.set('This account does not have admin access.');
        }
      },
      error: err => {
        this.isLoading.set(false);
        this.errorMessage.set(err.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.');
      }
    });
  }
}
