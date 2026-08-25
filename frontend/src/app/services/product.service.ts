import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { Product, ProductListItem, ProductQuery, ProductVariant } from '../models/product.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/products`;
  private adminUrl = `${environment.apiUrl}/admin/products`;

  list(query: ProductQuery = {}): Observable<{ items: ProductListItem[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { products: ProductListItem[] }; meta: ApiMeta }>(this.baseUrl, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.products, meta: res.meta as ApiMeta })));
  }

  featured(limit = 8): Observable<ProductListItem[]> {
    return this.http
      .get<{ data: { products: ProductListItem[] } }>(`${this.baseUrl}/featured`, { params: { limit } })
      .pipe(map(res => res.data.products));
  }

  getBySlug(slug: string): Observable<Product> {
    return this.http.get<{ data: { product: Product } }>(`${this.baseUrl}/${slug}`).pipe(map(res => res.data.product));
  }

  related(slug: string, limit = 8): Observable<ProductListItem[]> {
    return this.http
      .get<{ data: { products: ProductListItem[] } }>(`${this.baseUrl}/${slug}/related`, { params: { limit } })
      .pipe(map(res => res.data.products));
  }

  // ---- Admin ----

  adminList(query: Record<string, unknown> = {}): Observable<{ items: Product[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { products: Product[] }; meta: ApiMeta }>(this.adminUrl, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.products, meta: res.meta as ApiMeta })));
  }

  adminGet(id: number): Observable<Product> {
    return this.http.get<{ data: { product: Product } }>(`${this.adminUrl}/${id}`).pipe(map(res => res.data.product));
  }

  adminCreate(formData: FormData): Observable<Product> {
    return this.http.post<{ data: { product: Product } }>(this.adminUrl, formData).pipe(map(res => res.data.product));
  }

  adminUpdate(id: number, payload: Record<string, unknown>): Observable<Product> {
    return this.http
      .patch<{ data: { product: Product } }>(`${this.adminUrl}/${id}`, payload)
      .pipe(map(res => res.data.product));
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }

  adminAddImages(id: number, formData: FormData): Observable<Product['images']> {
    return this.http
      .post<{ data: { images: Product['images'] } }>(`${this.adminUrl}/${id}/images`, formData)
      .pipe(map(res => res.data.images));
  }

  adminDeleteImage(id: number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}/images/${imageId}`);
  }

  adminSetPrimaryImage(id: number, imageId: number): Observable<void> {
    return this.http.patch<void>(`${this.adminUrl}/${id}/images/${imageId}/primary`, {});
  }

  adminAddVariant(id: number, payload: Partial<ProductVariant>): Observable<ProductVariant> {
    return this.http
      .post<{ data: { variant: ProductVariant } }>(`${this.adminUrl}/${id}/variants`, payload)
      .pipe(map(res => res.data.variant));
  }

  adminUpdateVariant(id: number, variantId: number, payload: Partial<ProductVariant>): Observable<ProductVariant> {
    return this.http
      .patch<{ data: { variant: ProductVariant } }>(`${this.adminUrl}/${id}/variants/${variantId}`, payload)
      .pipe(map(res => res.data.variant));
  }

  adminDeleteVariant(id: number, variantId: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}/variants/${variantId}`);
  }

  adminAdjustStock(id: number, mode: 'SET' | 'INCREMENT' | 'DECREMENT', quantity: number): Observable<Product> {
    return this.http
      .patch<{ data: { product: Product } }>(`${this.adminUrl}/${id}/stock`, { mode, quantity })
      .pipe(map(res => res.data.product));
  }
}
