import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { CreateReviewPayload, Review } from '../models/review.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/reviews`;
  private adminUrl = `${environment.apiUrl}/admin/reviews`;

  forProduct(slug: string, query: { page?: number; limit?: number; sortBy?: string } = {}): Observable<{ items: Review[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { reviews: Review[] }; meta: ApiMeta }>(`${this.baseUrl}/product/${slug}`, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.reviews, meta: res.meta as ApiMeta })));
  }

  create(payload: CreateReviewPayload): Observable<Review> {
    return this.http.post<{ data: { review: Review } }>(this.baseUrl, payload).pipe(map(res => res.data.review));
  }

  update(id: number, payload: Partial<CreateReviewPayload>): Observable<Review> {
    return this.http.patch<{ data: { review: Review } }>(`${this.baseUrl}/${id}`, payload).pipe(map(res => res.data.review));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ---- Admin ----

  adminList(query: Record<string, unknown> = {}): Observable<{ items: Review[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { reviews: Review[] }; meta: ApiMeta }>(this.adminUrl, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.reviews, meta: res.meta as ApiMeta })));
  }

  adminApprove(id: number): Observable<Review> {
    return this.http
      .patch<{ data: { review: Review } }>(`${this.adminUrl}/${id}/approve`, {})
      .pipe(map(res => res.data.review));
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
