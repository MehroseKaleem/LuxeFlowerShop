import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { Category } from '../models/category.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/categories`;
  private adminUrl = `${environment.apiUrl}/admin/categories`;

  list(): Observable<Category[]> {
    return this.http
      .get<{ data: { categories: Category[] } }>(this.baseUrl)
      .pipe(map(res => res.data.categories));
  }

  getBySlug(slug: string): Observable<Category> {
    return this.http
      .get<{ data: { category: Category } }>(`${this.baseUrl}/${slug}`)
      .pipe(map(res => res.data.category));
  }

  adminList(query: { page?: number; limit?: number; search?: string; isActive?: boolean } = {}): Observable<{ items: Category[]; meta: ApiMeta }> {
    const params = toHttpParams(query);
    return this.http
      .get<{ data: { categories: Category[] }; meta: ApiMeta }>(this.adminUrl, { params })
      .pipe(map(res => ({ items: res.data.categories, meta: res.meta as ApiMeta })));
  }

  adminGet(id: number): Observable<Category> {
    return this.http.get<{ data: { category: Category } }>(`${this.adminUrl}/${id}`).pipe(map(res => res.data.category));
  }

  adminCreate(formData: FormData): Observable<Category> {
    return this.http.post<{ data: { category: Category } }>(this.adminUrl, formData).pipe(map(res => res.data.category));
  }

  adminUpdate(id: number, formData: FormData): Observable<Category> {
    return this.http
      .patch<{ data: { category: Category } }>(`${this.adminUrl}/${id}`, formData)
      .pipe(map(res => res.data.category));
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
