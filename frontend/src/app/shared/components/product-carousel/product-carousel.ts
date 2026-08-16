import { Component, HostListener, Input, PLATFORM_ID, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductListItem } from '../../../models/product.model';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  selector: 'app-product-carousel',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.scss'
})
export class ProductCarouselComponent {
  @Input({ required: true }) title = '';
  @Input({ required: true }) products: ProductListItem[] = [];
  @Input() viewAllLink: string | null = null;

  private readonly platformId = inject(PLATFORM_ID);
  protected readonly index = signal(0);
  protected itemsPerPage = signal(5);

  constructor() {
    afterNextRender(() => this.updateItemsPerPage());
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateItemsPerPage();
  }

  private updateItemsPerPage(): void {
    if (isPlatformBrowser(this.platformId)) {
      const width = window.innerWidth;
      this.itemsPerPage.set(width <= 480 ? 1 : width <= 768 ? 2 : width <= 1200 ? 3 : 5);
    }
  }

  next(): void {
    this.index.update(curr => (curr + 1) % this.products.length);
  }

  prev(): void {
    this.index.update(curr => (curr - 1 + this.products.length) % this.products.length);
  }
}
