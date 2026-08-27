import { Component, ElementRef, HostListener, OnInit, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { ProductListItem } from '../../models/product.model';
import { AedCurrencyPipe } from '../../shared/pipes/aed-currency.pipe';
import { mediaUrl } from '../../shared/utils/media.util';

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
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, AedCurrencyPipe],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  protected cart = inject(CartService);
  protected auth = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  protected readonly mobileMenuOpen = signal(false);
  protected readonly expandedMobileItem = signal<string | null>(null);
  protected readonly searchOpen = signal(false);
  protected readonly searchTerm = signal('');
  protected readonly suggestions = signal<ProductListItem[]>([]);
  protected readonly suggestionsLoading = signal(false);
  private readonly searchInput$ = new Subject<string>();
  @ViewChild('searchInputRef') private searchInputRef?: ElementRef<HTMLInputElement>;
  protected readonly scrolled = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.scrolled.set(window.scrollY > 24);
    }
  }

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

    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          const q = term.trim();
          if (q.length < 2) return of<ProductListItem[]>([]);
          this.suggestionsLoading.set(true);
          return this.productService.list({ search: q, limit: 6 }).pipe(
            switchMap(res => of(res.items)),
            catchError(() => of<ProductListItem[]>([]))
          );
        })
      )
      .subscribe(items => {
        this.suggestionsLoading.set(false);
        this.suggestions.set(items);
      });
  }

  onSearchInputChange(value: string): void {
    this.searchTerm.set(value);
    this.searchInput$.next(value);
  }

  selectSuggestion(product: ProductListItem): void {
    this.closeSearch();
    this.router.navigate(['/product', product.slug]);
  }

  suggestionImage(product: ProductListItem): string {
    return mediaUrl(product.images?.[0]?.url, undefined, 100);
  }

  closeSearch(): void {
    this.searchOpen.set(false);
    this.searchTerm.set('');
    this.suggestions.set([]);
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
    if (this.searchOpen() && isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.searchInputRef?.nativeElement.focus());
    } else {
      this.suggestions.set([]);
    }
  }

  submitSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) return;
    this.router.navigate(['/search'], { queryParams: { q: term } });
    this.closeSearch();
  }

  get accountLink(): string {
    return this.auth.isLoggedIn() ? '/account' : '/account/login';
  }
}
