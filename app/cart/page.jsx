'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ErrorDisplay, Spinner } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
export default function CartPage() {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingItems, setUpdatingItems] = useState(new Set());
    const fetchCart = async () => {
        var _a, _b;
        setLoading(true);
        try {
            const response = await api.get('/cart');
            setCart(response.data);
            setError(null);
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể tải giỏ hàng');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCart();
    }, []);
    const updateQuantity = async (itemId, newQuantity) => {
        var _a, _b;
        if (newQuantity < 1)
            return;
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            await api.put(`/cart/items/${itemId}`, { quantity: newQuantity });
            await fetchCart();
        }
        catch (err) {
            toast.error(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể cập nhật số lượng');
        }
        finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };
    const removeItem = async (itemId) => {
        var _a, _b;
        if (!confirm('Xóa sản phẩm này khỏi giỏ hàng?'))
            return;
        setUpdatingItems((prev) => new Set(prev).add(itemId));
        try {
            await api.delete(`/cart/items/${itemId}`);
            await fetchCart();
        }
        catch (err) {
            alert(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể xóa sản phẩm');
        }
        finally {
            setUpdatingItems((prev) => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
        }
    };
    if (loading) {
        return (<div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg"/>
      </div>);
    }
    if (error) {
        return <ErrorDisplay message={error} onRetry={() => fetchCart()}/>;
    }
    if (!cart || cart.items.length === 0) {
        return (<div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4"/>
        <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-8">
          Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá cửa hàng!
        </p>
        <Button asChild>
          <Link href="/products">Mua sắm ngay</Link>
        </Button>
      </div>);
    }
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Giỏ hàng</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (<Card key={item.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-md bg-zinc-100">
                      {item.product.images[0] ? (<img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover"/>) : (<div className="flex h-full items-center justify-center">
                          <span className="text-xs text-muted-foreground">No img</span>
                        </div>)}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link href={`/products/${item.product.id}`}>
                        <h3 className="font-semibold hover:text-primary">
                          {item.product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        Size: {item.variant.size} | Màu: {item.variant.color}
                      </p>
                      <p className="font-bold mt-2">{formatPrice(item.product.price)}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={updatingItems.has(item.id) || item.quantity <= 1}>
                          <Minus className="h-4 w-4"/>
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={updatingItems.has(item.id) || item.quantity >= item.variant.stock}>
                          <Plus className="h-4 w-4"/>
                        </Button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>

                      {/* Remove Button */}
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeItem(item.id)} disabled={updatingItems.has(item.id)}>
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Tổng đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Tạm tính</span>
                <span>{formatPrice(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Thuế (10%)</span>
                <span>{formatPrice(cart.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Phí vận chuyển</span>
                <span>{cart.shipping > 0 ? formatPrice(cart.shipping) : 'Miễn phí'}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span>{formatPrice(cart.total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout">
                  Thanh toán
                  <ArrowRight className="ml-2 h-4 w-4"/>
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>);
}
