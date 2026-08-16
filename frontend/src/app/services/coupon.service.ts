import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { Coupon } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {
  private http = inject(HttpClient);
  private adminUrl = `${environment.apiUrl}/admin/coupons`;

  adminList(query: Record<string, unknown> = {}): Observable<{ items: Coupon[]; meta: ApiMeta }> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http
      .get<{ data: { coupons: Coupon[] }; meta: ApiMeta }>(this.adminUrl, { params })
      .pipe(map(res => ({ items: res.data.coupons, meta: res.meta as ApiMeta })));
  }

  adminGet(id: number): Observable<Coupon> {
    return this.http.get<{ data: { coupon: Coupon } }>(`${this.adminUrl}/${id}`).pipe(map(res => res.data.coupon));
  }

  adminCreate(payload: Partial<Coupon>): Observable<Coupon> {
    return this.http.post<{ data: { coupon: Coupon } }>(this.adminUrl, payload).pipe(map(res => res.data.coupon));
  }

  adminUpdate(id: number, payload: Partial<Coupon>): Observable<Coupon> {
    return this.http
      .patch<{ data: { coupon: Coupon } }>(`${this.adminUrl}/${id}`, payload)
      .pipe(map(res => res.data.coupon));
  }

  adminToggle(id: number): Observable<Coupon> {
    return this.http.patch<{ data: { coupon: Coupon } }>(`${this.adminUrl}/${id}/toggle`, {}).pipe(map(res => res.data.coupon));
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
