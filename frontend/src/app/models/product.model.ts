export interface ProductImage {
  id: number;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  priceAdjustment: string;
  stock: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  slug: string;
}

/** Shape returned by list endpoints (GET /products, /products/featured, /products/:slug/related). */
export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePrice: string;
  discountPrice: string | null;
  stock: number;
  isFeatured: boolean;
  avgRating: string;
  reviewCount: number;
  images: ProductImage[];
  categories: ProductCategoryRef[];
}

/** Full shape returned by GET /products/:slug and admin product endpoints. */
export interface Product extends ProductListItem {
  sku: string;
  description: string | null;
  costPrice?: string | null;
  lowStockThreshold: number;
  weightGrams: number | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  variants: ProductVariant[];
  tags: ProductTag[];
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'basePrice' | 'avgRating' | 'name' | 'viewCount' | 'stock';
  sortOrder?: 'asc' | 'desc';
  category?: string;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  tag?: string;
  search?: string;
}
