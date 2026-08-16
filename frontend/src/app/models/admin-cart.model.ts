export interface AdminCartItem {
  id: number;
  productId: number;
  productName: string | null;
  productSlug: string | null;
  quantity: number;
  priceSnapshot: string;
}

export interface AdminCartSummary {
  id: number;
  isGuest: boolean;
  user: { id: number; name: string; email: string; phone: string } | null;
  itemsCount: number;
  estimatedTotal: number;
  items: AdminCartItem[];
  createdAt: string;
  updatedAt: string;
}
