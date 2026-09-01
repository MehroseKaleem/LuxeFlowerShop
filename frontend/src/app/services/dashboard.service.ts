import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  DashboardOverview,
  OrderStatusBreakdown,
  SalesPoint,
  TopProduct
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/dashboard`;

  overview(): Observable<DashboardOverview> {
    return this.http
      .get<{ data: { overview: DashboardOverview } }>(`${this.baseUrl}/overview`)
      .pipe(map(res => res.data.overview));
  }

  sales(days = 30): Observable<SalesPoint[]> {
    return this.http
      .get<{ data: { sales: SalesPoint[] } }>(`${this.baseUrl}/sales`, { params: { days } })
      .pipe(map(res => res.data.sales));
  }

  topProducts(limit = 10): Observable<TopProduct[]> {
    return this.http
      .get<{ data: { products: TopProduct[] } }>(`${this.baseUrl}/top-products`, { params: { limit } })
      .pipe(map(res => res.data.products));
  }

  orderStatusBreakdown(): Observable<OrderStatusBreakdown[]> {
    return this.http
      .get<{ data: { breakdown: OrderStatusBreakdown[] } }>(`${this.baseUrl}/order-status-breakdown`)
      .pipe(map(res => res.data.breakdown));
  }
}
