import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { Address, AddressInput, User, UserRole } from '../models/user.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/users`;
  private adminUrl = `${environment.apiUrl}/admin/users`;

  updateProfile(payload: { name?: string; phone?: string }): Observable<User> {
    return this.http.patch<{ data: { user: User } }>(`${this.baseUrl}/me`, payload).pipe(map(res => res.data.user));
  }

  uploadAvatar(formData: FormData): Observable<User> {
    return this.http
      .post<{ data: { user: User } }>(`${this.baseUrl}/me/avatar`, formData)
      .pipe(map(res => res.data.user));
  }

  myAddresses(): Observable<Address[]> {
    return this.http
      .get<{ data: { addresses: Address[] } }>(`${this.baseUrl}/me/addresses`)
      .pipe(map(res => res.data.addresses));
  }

  addAddress(payload: AddressInput): Observable<Address> {
    return this.http
      .post<{ data: { address: Address } }>(`${this.baseUrl}/me/addresses`, payload)
      .pipe(map(res => res.data.address));
  }

  updateAddress(id: number, payload: Partial<AddressInput>): Observable<Address> {
    return this.http
      .patch<{ data: { address: Address } }>(`${this.baseUrl}/me/addresses/${id}`, payload)
      .pipe(map(res => res.data.address));
  }

  deleteAddress(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/me/addresses/${id}`);
  }

  setDefaultAddress(id: number): Observable<Address> {
    return this.http
      .patch<{ data: { address: Address } }>(`${this.baseUrl}/me/addresses/${id}/default`, {})
      .pipe(map(res => res.data.address));
  }

  // ---- Admin ----

  adminList(query: Record<string, unknown> = {}): Observable<{ items: User[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { users: User[] }; meta: ApiMeta }>(this.adminUrl, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.users, meta: res.meta as ApiMeta })));
  }

  adminGet(id: number): Observable<User & { addresses: Address[] }> {
    return this.http
      .get<{ data: { user: User & { addresses: Address[] } } }>(`${this.adminUrl}/${id}`)
      .pipe(map(res => res.data.user));
  }

  adminSetStatus(id: number, isActive: boolean): Observable<User> {
    return this.http
      .patch<{ data: { user: User } }>(`${this.adminUrl}/${id}/status`, { isActive })
      .pipe(map(res => res.data.user));
  }

  adminSetRole(id: number, role: UserRole): Observable<User> {
    return this.http.patch<{ data: { user: User } }>(`${this.adminUrl}/${id}/role`, { role }).pipe(map(res => res.data.user));
  }
}
