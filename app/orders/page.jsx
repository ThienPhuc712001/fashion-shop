'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { formatPrice, formatDate } from '@/lib/utils';
import { Package } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchOrders();
    }, [router]);
    const fetchOrders = async () => {
        var _a, _b, _c;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/orders');
            setOrders(res.data);
        }
        catch (err) {
            if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            }
            else {
                setError(((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Không thể tải đơn hàng');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'delivered': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    if (loading) {
        return (<div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg"/>
      </div>);
    }
    if (error) {
        return <ErrorDisplay message={error} onRetry={fetchOrders}/>;
    }
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (<Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4"/>
            <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào.</p>
            <Button asChild>
              <Link href="/products">Mua sắm ngay</Link>
            </Button>
          </CardContent>
        </Card>) : (<div className="space-y-4">
          {orders.map((order) => (<Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Đơn hàng #{order.orderNumber}</CardTitle>
                    <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.slice(0, 3).map((item) => {
                    var _a, _b, _c, _d, _e;
                    return (<div key={item.id} className="flex gap-4">
                      <div className="h-16 w-16 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                        {((_b = (_a = item.product) === null || _a === void 0 ? void 0 : _a.images) === null || _b === void 0 ? void 0 : _b[0]) && (<img src={item.product.images[0]} alt="" className="h-full w-full object-cover"/>)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{(_c = item.product) === null || _c === void 0 ? void 0 : _c.name}</p>
                        <p className="text-sm text-muted-foreground">Size: {(_d = item.variant) === null || _d === void 0 ? void 0 : _d.size}, Màu: {(_e = item.variant) === null || _e === void 0 ? void 0 : _e.color}</p>
                        <p className="text-sm">SL: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>);
                })}
                  {order.items.length > 3 && (<p className="text-sm text-muted-foreground">+{order.items.length - 3} sản phẩm khác</p>)}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod === 'momo' ? 'Momo' : 'VNPay'} • {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </div>
                <div className="font-bold text-lg">{formatPrice(order.total)}</div>
              </CardFooter>
            </Card>))}
        </div>)}
    </div>);
}
