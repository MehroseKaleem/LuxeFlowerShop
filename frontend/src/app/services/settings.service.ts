import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { StoreSettings } from '../models/settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/settings`;
  private adminUrl = `${environment.apiUrl}/admin/settings`;

  get(): Observable<StoreSettings> {
    return this.http.get<{ data: { settings: StoreSettings } }>(this.baseUrl).pipe(map(res => res.data.settings));
  }

  adminGet(): Observable<StoreSettings> {
    return this.http.get<{ data: { settings: StoreSettings } }>(this.adminUrl).pipe(map(res => res.data.settings));
  }

  adminUpdate(payload: Partial<StoreSettings>): Observable<StoreSettings> {
    return this.http
      .patch<{ data: { settings: StoreSettings } }>(this.adminUrl, payload)
      .pipe(map(res => res.data.settings));
  }
}
