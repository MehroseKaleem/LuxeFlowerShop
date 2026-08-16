import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiMeta } from '../models/api-response.model';
import { CreateOrderPayload, Order, OrderStatus, PaymentStatus } from '../models/order.model';
import { toHttpParams } from '../shared/utils/http-params.util';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/orders`;
  private adminUrl = `${environment.apiUrl}/admin/orders`;

  create(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<{ data: { order: Order } }>(this.baseUrl, payload).pipe(map(res => res.data.order));
  }

  myOrders(query: { page?: number; limit?: number } = {}): Observable<{ items: Order[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { orders: Order[] }; meta: ApiMeta }>(this.baseUrl, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.orders, meta: res.meta as ApiMeta })));
  }

  getByOrderNumber(orderNumber: string): Observable<Order> {
    return this.http
      .get<{ data: { order: Order } }>(`${this.baseUrl}/${orderNumber}`)
      .pipe(map(res => res.data.order));
  }

  // ---- Admin ----

  adminList(query: Record<string, unknown> = {}): Observable<{ items: Order[]; meta: ApiMeta }> {
    return this.http
      .get<{ data: { orders: Order[] }; meta: ApiMeta }>(this.adminUrl, { params: toHttpParams(query) })
      .pipe(map(res => ({ items: res.data.orders, meta: res.meta as ApiMeta })));
  }

  adminGet(id: number): Observable<Order> {
    return this.http.get<{ data: { order: Order } }>(`${this.adminUrl}/${id}`).pipe(map(res => res.data.order));
  }

  adminUpdateStatus(id: number, status: OrderStatus, note?: string): Observable<Order> {
    return this.http
      .patch<{ data: { order: Order } }>(`${this.adminUrl}/${id}/status`, { status, note })
      .pipe(map(res => res.data.order));
  }

  adminUpdatePaymentStatus(id: number, paymentStatus: PaymentStatus): Observable<Order> {
    return this.http
      .patch<{ data: { order: Order } }>(`${this.adminUrl}/${id}/payment-status`, { paymentStatus })
      .pipe(map(res => res.data.order));
  }
}
