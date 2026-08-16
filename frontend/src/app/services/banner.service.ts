import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { Banner } from '../models/banner.model';

@Injectable({
  providedIn: 'root'
})
export class BannerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/banners`;
  private adminUrl = `${environment.apiUrl}/admin/banners`;

  list(position?: string): Observable<Banner[]> {
    const params = position ? new HttpParams().set('position', position) : undefined;
    return this.http.get<{ data: { banners: Banner[] } }>(this.baseUrl, { params }).pipe(map(res => res.data.banners));
  }

  // ---- Admin ----

  adminList(query: Record<string, unknown> = {}): Observable<{ items: Banner[]; meta: ApiMeta }> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
    });
    return this.http
      .get<{ data: { banners: Banner[] }; meta: ApiMeta }>(this.adminUrl, { params })
      .pipe(map(res => ({ items: res.data.banners, meta: res.meta as ApiMeta })));
  }

  adminCreate(formData: FormData): Observable<Banner> {
    return this.http.post<{ data: { banner: Banner } }>(this.adminUrl, formData).pipe(map(res => res.data.banner));
  }

  adminUpdate(id: number, formData: FormData): Observable<Banner> {
    return this.http
      .patch<{ data: { banner: Banner } }>(`${this.adminUrl}/${id}`, formData)
      .pipe(map(res => res.data.banner));
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
