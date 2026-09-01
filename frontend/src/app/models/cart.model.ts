export interface CartLineProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  basePrice: string;
  discountPrice: string | null;
  isActive: boolean;
  images: { url: string }[];
}

export interface CartLineVariant {
  id: number;
  name: string;
  priceAdjustment: string;
}

export interface CartLineItem {
  id: number;
  productId: number;
  variantId: number | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: CartLineProduct;
  variant: CartLineVariant | null;
}

export interface CartCoupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: string;
}

export interface Cart {
  id: number;
  items: CartLineItem[];
  subtotal: number;
  coupon: CartCoupon | null;
  discountAmount: number;
  total: number;
}
