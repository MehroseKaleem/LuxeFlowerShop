import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

export interface DropdownOption {
  label: string;
  link: string;
}

export interface NavItem {
  id: string;
  label: string;
  link: string;
  hasDropdown: boolean;
  dropdownOptions?: DropdownOption[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  private categoryService = inject(CategoryService);
  protected cart = inject(CartService);
  protected auth = inject(AuthService);
  private router = inject(Router);

  protected readonly mobileMenuOpen = signal(false);
  protected readonly expandedMobileItem = signal<string | null>(null);
  protected readonly searchOpen = signal(false);
  protected readonly searchTerm = signal('');

  protected readonly navItems = signal<NavItem[]>([
    { label: 'Home', link: '/', id: 'home', hasDropdown: false },
    { label: 'Shop', link: '/shop', id: 'shop', hasDropdown: false },
    { label: 'Our Story', link: '/about', id: 'about', hasDropdown: false },
    {
      label: 'Blog',
      link: '/blog',
      id: 'blog',
      hasDropdown: true,
      dropdownOptions: [
        { label: 'News', link: '/blog/news' },
        { label: 'Bloom', link: '/blog/bloom' }
      ]
    },
    { label: 'Contact us', link: '/contact', id: 'contact', hasDropdown: false }
  ]);

  ngOnInit(): void {
    this.categoryService.list().subscribe({
      next: categories => {
        const shopDropdown: DropdownOption[] = categories.map(c => ({ label: c.name, link: `/category/${c.slug}` }));
        this.navItems.update(items =>
          items.map(item =>
            item.id === 'shop' ? { ...item, hasDropdown: shopDropdown.length > 0, dropdownOptions: shopDropdown } : item
          )
        );
      },
      error: () => {
        // Keep the static "Shop" link with no dropdown if categories fail to load.
      }
    });

    this.cart.loadCart().subscribe({ error: () => undefined });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleMobileSubmenu(id: string, event: Event): void {
    event.stopPropagation();
    this.expandedMobileItem.update(current => (current === id ? null : id));
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.expandedMobileItem.set(null);
  }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
  }

  submitSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) return;
    this.searchOpen.set(false);
    this.router.navigate(['/search'], { queryParams: { q: term } });
    this.searchTerm.set('');
  }

  get accountLink(): string {
    return this.auth.isLoggedIn() ? '/account' : '/account/login';
  }
}
