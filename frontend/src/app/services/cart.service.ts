import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cart } from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/cart`;

  private readonly _cart = signal<Cart | null>(null);
  readonly cart = this._cart.asReadonly();
  readonly itemCount = computed(() => this._cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0);

  private unwrap(): (source: Observable<{ data: { cart: Cart } }>) => Observable<Cart> {
    return (source: Observable<{ data: { cart: Cart } }>) =>
      source.pipe(
        map(res => res.data.cart),
        tap(cart => this._cart.set(cart))
      );
  }

  loadCart(): Observable<Cart> {
    return this.http.get<{ data: { cart: Cart } }>(this.baseUrl).pipe(this.unwrap());
  }

  addItem(productId: number, quantity = 1, variantId?: number): Observable<Cart> {
    return this.http
      .post<{ data: { cart: Cart } }>(`${this.baseUrl}/items`, { productId, quantity, variantId })
      .pipe(this.unwrap());
  }

  updateItemQuantity(itemId: number, quantity: number): Observable<Cart> {
    return this.http
      .patch<{ data: { cart: Cart } }>(`${this.baseUrl}/items/${itemId}`, { quantity })
      .pipe(this.unwrap());
  }

  removeItem(itemId: number): Observable<Cart> {
    return this.http.delete<{ data: { cart: Cart } }>(`${this.baseUrl}/items/${itemId}`).pipe(this.unwrap());
  }

  clearCart(): Observable<Cart> {
    return this.http.delete<{ data: { cart: Cart } }>(this.baseUrl).pipe(this.unwrap());
  }

  applyCoupon(code: string, email?: string, phone?: string): Observable<Cart> {
    return this.http.post<{ data: { cart: Cart } }>(`${this.baseUrl}/coupon`, { code, email, phone }).pipe(this.unwrap());
  }

  removeCoupon(): Observable<Cart> {
    return this.http.delete<{ data: { cart: Cart } }>(`${this.baseUrl}/coupon`).pipe(this.unwrap());
  }

  mergeGuestCart(sessionId: string): Observable<Cart> {
    return this.http.post<{ data: { cart: Cart } }>(`${this.baseUrl}/merge`, { sessionId }).pipe(this.unwrap());
  }

  reset(): void {
    this._cart.set(null);
  }
}
