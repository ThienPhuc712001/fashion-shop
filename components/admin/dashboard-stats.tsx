import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { DollarSign, ShoppingCart, Package, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatsProps {
  stats: any;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      title: 'Tổng doanh thu',
      value: formatPrice(stats?.totalRevenue || 0),
      change: stats?.revenueChange || 0,
      icon: DollarSign,
    },
    {
      title: 'Đơn hàng',
      value: stats?.totalOrders || 0,
      change: stats?.ordersChange || 0,
      icon: ShoppingCart,
    },
    {
      title: 'Sản phẩm',
      value: stats?.totalProducts || 0,
      change: undefined,
      icon: Package,
    },
    {
      title: 'Khách hàng',
      value: stats?.totalCustomers || 0,
      change: stats?.customersChange || 0,
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statItems.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                <span>{Math.abs(stat.change)}% so với tháng trước</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
