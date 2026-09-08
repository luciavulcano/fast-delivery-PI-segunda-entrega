export type UserRole = 'CLIENT' | 'MERCHANT' | 'COURIER' | 'ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Session {
  accessToken: string;
  user: AuthUser;
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  logoUrl?: string | null;
  isOpen: boolean;
  deliveryFee: string;
  minOrder: string;
  etaMinMinutes: number;
  etaMaxMinutes: number;
  menuItems?: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  category?: string | null;
  isAvailable: boolean;
}

export interface Address {
  id: string;
  label?: string | null;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TrackingEvent {
  id: string;
  status: OrderStatus;
  message?: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitPrice: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: string;
  deliveryFee: string;
  total: string;
  createdAt: string;
  items: OrderItem[];
  restaurant: { id: string; name: string; category: string };
  tracking: TrackingEvent[];
}
