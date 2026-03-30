'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Cart } from '@/lib/api';
import api from '@/lib/api';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Cart>('/cart');
      setCart(response.data);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Không thể tải giỏ hàng');
      } else {
        // Unauthorized, clear cart for guest
        setCart({ sessionId: '', items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    await fetchCart();
  };

  const addToCart = async (productId: string, variantId: string, quantity: number) => {
    try {
      setError(null);
      await api.post('/cart/items', { productId, variantId, quantity });
      await fetchCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể thêm vào giỏ hàng');
      throw err;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      setError(null);
      await api.put(`/cart/items/${itemId}`, { quantity });
      await fetchCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật giỏ hàng');
      throw err;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      setError(null);
      await api.delete(`/cart/items/${itemId}`);
      await fetchCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa sản phẩm');
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      await api.delete('/cart/items');
      await fetchCart();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể xóa giỏ hàng');
      throw err;
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      error,
      refreshCart,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
