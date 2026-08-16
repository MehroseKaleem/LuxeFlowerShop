export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string | null;
  maxDiscountAmount: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
