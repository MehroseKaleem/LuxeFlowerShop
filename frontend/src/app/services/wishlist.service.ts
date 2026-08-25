import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { WishlistItem } from '../models/wishlist.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/wishlist`;

  private readonly _items = signal<WishlistItem[]>([]);
  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().length);

  load(): Observable<WishlistItem[]> {
    return this.http
      .get<{ data: { wishlist: WishlistItem[] } }>(this.baseUrl)
      .pipe(
        map(res => res.data.wishlist),
        tap(items => this._items.set(items))
      );
  }

  add(productId: number): Observable<void> {
    return this.http.post<void>(this.baseUrl, { productId }).pipe(tap(() => this.load().subscribe()));
  }

  remove(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${productId}`).pipe(
      tap(() => this._items.update(items => items.filter(i => i.productId !== productId)))
    );
  }

  isWishlisted(productId: number): boolean {
    return this._items().some(i => i.productId === productId);
  }

  reset(): void {
    this._items.set([]);
  }
}
