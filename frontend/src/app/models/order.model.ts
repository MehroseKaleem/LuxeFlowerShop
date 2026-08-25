export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentMethod = 'COD' | 'STRIPE';

/** Valid next statuses per current status, mirrors the backend state machine. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: []
};

export interface OrderItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  sku: string;
  price: string;
  quantity: number;
  subtotal: string;
}

export interface OrderStatusEvent {
  id: number;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderAddress {
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  emirate: string;
  country?: string;
  postalCode?: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number | null;
  user?: { id: number; name: string; email: string; phone?: string } | null;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  tax: string;
  total: string;
  couponCode: string | null;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress | null;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  notes: string | null;
  stripePaymentIntentId?: string | null;
  items: OrderItem[];
  statusHistory?: OrderStatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  paymentMethod: PaymentMethod;
  shippingAddressId?: number;
  shippingAddress?: OrderAddress;
  billingAddress?: OrderAddress;
  guestEmail?: string;
  guestPhone?: string;
  couponCode?: string;
  deliveryDate?: string;
  deliveryTimeSlot?: string;
  notes?: string;
}
