import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate } from '@/lib/utils';
import { Eye, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import Link from 'next/link';

interface RecentOrdersProps {
  orders?: any[];
}

const statusConfig = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Đang xử lý', color: 'bg-blue-100 text-blue-800', icon: Clock },
  shipped: { label: 'Đã giao', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function RecentOrders({ orders = [] }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn hàng gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Chưa có đơn hàng nào</p>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
              return (
                <div key={order.id} className="flex items-center justify-between gap-4 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{order.orderNumber}</span>
                      <Badge variant="secondary" className={status.color}>
                        <status.icon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')} • {order.items?.length || 0} sản phẩm
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(order.total)}</p>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/admin/orders">Xem tất cả đơn hàng</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
