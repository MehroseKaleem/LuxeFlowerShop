import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/payments`;

  createIntent(orderNumber: string, email?: string): Observable<string> {
    return this.http
      .post<{ data: { clientSecret: string } }>(`${this.baseUrl}/create-intent`, { orderNumber, email })
      .pipe(map(res => res.data.clientSecret));
  }
}
