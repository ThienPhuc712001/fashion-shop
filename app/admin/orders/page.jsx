'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { formatPrice, formatDate } from '@/lib/utils';
import { Eye } from 'lucide-react';
import api from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
export default function AdminOrdersPage() {
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
            const res = await api.get('/orders?limit=100');
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý đơn hàng</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả đơn hàng ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Thanh toán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (<TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.guestEmail || 'Khách'}</TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod === 'momo' ? 'Momo' : 'VNPay'}</span>
                      <span className={`px-2 py-1 rounded text-xs w-fit ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="icon" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                      <Eye className="h-4 w-4"/>
                    </Button>
                  </TableCell>
                </TableRow>))}
              {orders.length === 0 && (<TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chưa có đơn hàng nào
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>);
}
