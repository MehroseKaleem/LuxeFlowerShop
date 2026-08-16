import { ProductListItem } from './product.model';

export interface WishlistItem {
  id: number;
  productId: number;
  createdAt: string;
  product: ProductListItem;
}
