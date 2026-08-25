import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { NewsletterSubscriber } from '../models/newsletter.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/newsletter`;
  private adminUrl = `${environment.apiUrl}/admin/newsletter`;

  subscribe(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/subscribe`, { email });
  }

  unsubscribe(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/unsubscribe`, { email });
  }

  adminList(query: { page?: number; limit?: number; isActive?: boolean } = {}): Observable<{ items: NewsletterSubscriber[]; meta: ApiMeta }> {
    const params = toHttpParams(query);
    return this.http
      .get<{ data: { subscribers: NewsletterSubscriber[] }; meta: ApiMeta }>(this.adminUrl, { params })
      .pipe(map(res => ({ items: res.data.subscribers, meta: res.meta as ApiMeta })));
  }
}
