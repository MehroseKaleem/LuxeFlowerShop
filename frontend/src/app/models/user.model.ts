export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number; reviews: number };
}

export interface Address {
  id: number;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  emirate: string;
  country: string;
  postalCode: string | null;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id' | 'country' | 'isDefault'> & { country?: string; isDefault?: boolean };
