'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
const CartContext = createContext(undefined);
export function CartProvider({ children }) {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchCart = async () => {
        var _a, _b, _c;
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/cart');
            setCart(response.data);
        }
        catch (err) {
            if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) !== 401) {
                setError(((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Không thể tải giỏ hàng');
            }
            else {
                // Unauthorized, clear cart for guest
                setCart({ sessionId: '', items: [], subtotal: 0, tax: 0, shipping: 0, total: 0 });
            }
        }
        finally {
            setLoading(false);
        }
    };
    const refreshCart = async () => {
        await fetchCart();
    };
    const addToCart = async (productId, variantId, quantity) => {
        var _a, _b;
        try {
            setError(null);
            await api.post('/cart/items', { productId, variantId, quantity });
            await fetchCart();
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể thêm vào giỏ hàng');
            throw err;
        }
    };
    const updateQuantity = async (itemId, quantity) => {
        var _a, _b;
        try {
            setError(null);
            await api.put(`/cart/items/${itemId}`, { quantity });
            await fetchCart();
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể cập nhật giỏ hàng');
            throw err;
        }
    };
    const removeFromCart = async (itemId) => {
        var _a, _b;
        try {
            setError(null);
            await api.delete(`/cart/items/${itemId}`);
            await fetchCart();
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể xóa sản phẩm');
            throw err;
        }
    };
    const clearCart = async () => {
        var _a, _b;
        try {
            setError(null);
            await api.delete('/cart/items');
            await fetchCart();
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể xóa giỏ hàng');
            throw err;
        }
    };
    useEffect(() => {
        fetchCart();
    }, []);
    const itemCount = (cart === null || cart === void 0 ? void 0 : cart.items.reduce((sum, item) => sum + item.quantity, 0)) || 0;
    return (<CartContext.Provider value={{
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
    </CartContext.Provider>);
}
export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
