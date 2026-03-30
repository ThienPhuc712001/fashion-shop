export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'admin';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string | null;
  recipient_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street_address: string;
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  base_price: number;
  compare_price: number | null;
  is_active: boolean;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color_name: string | null;
  color_hex: string | null;
  material: string | null;
  price_adjustment: number;
  stock_quantity: number;
  low_stock_threshold: number;
  weight_grams: number | null;
  barcode: string | null;
  is_available: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface CartSession {
  id: string;
  user_id: string | null;
  session_token: string;
  expires_at: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  cart_session_id: string;
  variant_id: string;
  quantity: number;
  price_snapshot: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipping_address: any; // JSONB
  billing_address: any | null;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  currency: string;
  payment_method: 'momo' | 'vnpay' | 'cod' | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_gateway: string | null;
  payment_gateway_txn_id: string | null;
  shipping_method: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  product_name: string;
  variant_sku: string | null;
  variant_size: string | null;
  variant_color: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Coupon {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  per_user_limit: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface OrderCoupon {
  order_id: string;
  coupon_id: string;
  discount_applied: number;
}

export interface Review {
  id: string;
  user_id: string;
  order_item_id: string | null;
  product_id: string;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  helpful_votes: number;
  is_visible: boolean;
  created_at: string;
}

export interface WishlistItem {
  user_id: string;
  product_id: string;
  created_at: string;
}

// Request DTOs
export interface RegisterDto {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  category_id?: string;
  brand_id?: string;
  base_price: number;
  compare_price?: number;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface CreateVariantDto {
  product_id: string;
  sku: string;
  size?: string;
  color_name?: string;
  color_hex?: string;
  material?: string;
  price_adjustment?: number;
  stock_quantity: number;
  low_stock_threshold?: number;
  weight_grams?: number;
  barcode?: string;
}

export interface CartItemDto {
  variant_id: string;
  quantity: number;
}

export interface CheckoutDto {
  email?: string; // Required for guest checkout
  shipping_address: {
    recipient_name: string;
    phone: string;
    province: string;
    district: string;
    ward: string;
    street_address: string;
  };
  billing_address?: any;
  shipping_method: string;
  payment_method: 'momo' | 'vnpay' | 'cod';
  coupon_code?: string;
  notes?: string;
}

export interface PaymentCallbackDto {
  order_id: string;
  transaction_id: string;
  status: 'success' | 'failed';
  message?: string;
}