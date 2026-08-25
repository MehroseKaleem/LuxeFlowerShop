import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './account-layout.html',
  styleUrl: './account-layout.scss'
})
export class AccountLayoutComponent implements OnInit {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.set({ title: 'My Account', description: 'Manage your Luxeflower account, orders, addresses and wishlist.', noindex: true });
  }

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
