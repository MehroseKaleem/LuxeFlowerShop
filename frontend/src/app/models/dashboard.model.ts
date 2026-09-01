import { OrderStatus } from './order.model';

export interface DashboardOverview {
  totalOrders: number;
  todayOrders: number;
  monthOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  totalRevenue: number;
  monthRevenue: number;
}

export interface SalesPoint {
  date: string;
  orderCount: number;
  revenue: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface OrderStatusBreakdown {
  status: OrderStatus;
  count: number;
}
