export interface Review {
  id: number;
  productId: number;
  userId: number;
  orderId: number | null;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; name: string; email?: string };
  product?: { id: number; name: string; slug: string };
}

export interface CreateReviewPayload {
  productId: number;
  orderId?: number;
  rating: number;
  title?: string;
  comment?: string;
}
