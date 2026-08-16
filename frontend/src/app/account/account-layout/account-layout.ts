import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './account-layout.html',
  styleUrl: './account-layout.scss'
})
export class AccountLayoutComponent {
  protected auth = inject(AuthService);
  private router = inject(Router);

  protected readonly navItems = [
    { label: 'Profile', link: '/account/profile' },
    { label: 'Addresses', link: '/account/addresses' },
    { label: 'My Orders', link: '/account/orders' },
    { label: 'Wishlist', link: '/account/wishlist' }
  ];

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: () => this.router.navigateByUrl('/')
    });
  }
}
