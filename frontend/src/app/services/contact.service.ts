import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { ContactMessage, ContactMessagePayload } from '../models/contact.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/contact`;
  private adminUrl = `${environment.apiUrl}/admin/contact`;

  submit(payload: ContactMessagePayload): Observable<void> {
    return this.http.post<void>(this.baseUrl, payload);
  }

  // ---- Admin ----

  adminList(query: Record<string, unknown> = {}): Observable<{ items: ContactMessage[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { messages: ContactMessage[] }; meta: ApiMeta }>(this.adminUrl, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.messages, meta: res.meta as ApiMeta })));
  }

  adminMarkRead(id: number): Observable<ContactMessage> {
    return this.http
      .patch<{ data: { message: ContactMessage } }>(`${this.adminUrl}/${id}/read`, {})
      .pipe(map(res => res.data.message));
  }

  adminReply(id: number, message: string): Observable<ContactMessage> {
    return this.http
      .post<{ data: { message: ContactMessage } }>(`${this.adminUrl}/${id}/reply`, { message })
      .pipe(map(res => res.data.message));
  }

  adminDelete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
