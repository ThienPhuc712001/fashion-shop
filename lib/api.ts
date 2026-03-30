import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Just pass through errors - components will handle them
    return Promise.reject(error);
  }
);

export default api;

// TypeScript types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
    slug: string;
  };
  variants: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Cart {
  sessionId: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  guestEmail?: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'momo' | 'vnpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentUrl?: string; // for redirect payment
  notes?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
  price: number;
}

// Types for creating order (request body)
export interface CreateOrderItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderAddress {
  name: string;
  phone: string;
  email?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  id?: string; // optional for new address
  isDefault?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  children?: Category[];
  sort_order?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}
