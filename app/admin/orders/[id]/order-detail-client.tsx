'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { Order } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { ArrowLeft, Package, Truck, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface OrderDetailClientProps {
  orderId: string;
}

export default function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Order>(`/orders/${orderId}`);
      setOrder(res.data);
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

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Đã cập nhật trạng thái');
      fetchOrder();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
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
    return <ErrorDisplay message={error} onRetry={fetchOrder} />;
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Không tìm thấy đơn hàng</p>
        <Button onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

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

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Quay lại
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Đơn hàng #{order.orderNumber}</h1>
          <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Sản phẩm ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] && (
                        <img src={item.product.images[0]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">Size: {item.variant?.size}, Màu: {item.variant?.color}</p>
                      <p className="text-sm">SL: {item.quantity} × {formatPrice(item.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Địa chỉ giao hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{order.shippingAddress.name}</p>
                <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
                <p className="text-sm">{order.shippingAddress.street}</p>
                <p className="text-sm">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                <p className="text-sm">{order.shippingAddress.country}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Địa chỉ thanh toán</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{order.billingAddress.name}</p>
                <p className="text-sm text-muted-foreground">{order.billingAddress.phone}</p>
                <p className="text-sm">{order.billingAddress.street}</p>
                <p className="text-sm">{order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zipCode}</p>
                <p className="text-sm">{order.billingAddress.country}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Vận chuyển</span>
                <span>{order.shipping === 0 ? 'Miễn phí' : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between">
                <span>Thuế (10%)</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Phương thức</span>
                <span>{order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod === 'momo' ? 'Momo' : 'VNPay'}</span>
              </div>
              <div className="flex justify-between">
                <span>Trạng thái</span>
                <span className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                  {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
              {order.paymentUrl && (
                <Button variant="outline" className="w-full mt-2" asChild>
                  <a href={order.paymentUrl} target="_blank" rel="noopener noreferrer">
                    Thanh toán ngay
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cập nhật trạng thái</CardTitle>
              <CardDescription>Thay đổi trạng thái đơn hàng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                <Button
                  key={status}
                  variant={order.status === status ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => updateStatus(status)}
                  disabled={updating || order.status === status}
                >
                  {status === 'pending' && <Package className="h-4 w-4 mr-2" />}
                  {status === 'processing' && <Truck className="h-4 w-4 mr-2" />}
                  {status === 'delivered' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {status === 'cancelled' && <span className="h-4 w-4 mr-2">✕</span>}
                  {status === 'pending' && 'Chờ xác nhận'}
                  {status === 'processing' && 'Đang xử lý'}
                  {status === 'shipped' && 'Đã gửi hàng'}
                  {status === 'delivered' && 'Đã giao'}
                  {status === 'cancelled' && 'Đã hủy'}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
