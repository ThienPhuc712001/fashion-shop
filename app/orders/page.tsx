'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { Order } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { Package, Eye } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [router]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Order[]>('/orders');
      setOrders(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải đơn hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
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
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchOrders} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Bạn chưa có đơn hàng nào.</p>
            <Button asChild>
              <Link href="/products">Mua sắm ngay</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
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
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-16 w-16 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">Size: {item.variant?.size}, Màu: {item.variant?.color}</p>
                        <p className="text-sm">SL: {item.quantity} × {formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-sm text-muted-foreground">+{order.items.length - 3} sản phẩm khác</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod === 'momo' ? 'Momo' : 'VNPay'} • {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </div>
                <div className="font-bold text-lg">{formatPrice(order.total)}</div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
