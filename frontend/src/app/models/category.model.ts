export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image: string | null;
  parentId: number | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  _count?: { products: number; children?: number };
  children?: Category[];
}
