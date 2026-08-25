import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { AdminCartSummary } from '../models/admin-cart.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class AdminCartService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/carts`;

  list(query: { page?: number; limit?: number; abandonedDays?: number } = {}): Observable<{ items: AdminCartSummary[]; meta: ApiMeta }> {
    const params = toHttpParams(query);
    return this.http
      .get<{ data: { carts: AdminCartSummary[] }; meta: ApiMeta }>(this.baseUrl, { params })
      .pipe(map(res => ({ items: res.data.carts, meta: res.meta as ApiMeta })));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
