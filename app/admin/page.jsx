'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/components/admin/dashboard-stats';
import { RecentOrders } from '@/components/admin/recent-orders';
import api from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function AdminPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        fetchDashboardStats();
    }, []);
    const fetchDashboardStats = async () => {
        var _a, _b, _c;
        try {
            const response = await api.get('/admin/dashboard/stats');
            setStats(response.data);
        }
        catch (err) {
            if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                window.location.href = '/login';
                return;
            }
            setError(((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Không thể tải dữ liệu');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (<div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"/>
        </div>
      </div>);
    }
    if (error) {
        return (<div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchDashboardStats}>Thử lại</Button>
        </div>
      </div>);
    }
    return (<div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Quản lý cửa hàng của bạn</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products">Sản phẩm</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/orders">Đơn hàng</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">Thêm sản phẩm</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats stats={stats}/>

      <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <RecentOrders orders={stats === null || stats === void 0 ? void 0 : stats.recentOrders}/>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Các tác vụ quản trị thường dùng</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Link href="/admin/products/new">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <span className="text-2xl">📦</span>
                <span>Thêm sản phẩm</span>
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <span className="text-2xl">📋</span>
                <span>Quản lý đơn hàng</span>
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <span className="text-2xl">🏷️</span>
                <span>Danh mục</span>
              </Button>
            </Link>
            <Link href="/admin/brands">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <span className="text-2xl">🎨</span>
                <span>Thương hiệu</span>
              </Button>
            </Link>
            <Link href="/admin/coupons">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                <span className="text-2xl">🎟️</span>
                <span>Mã giảm giá</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>);
}
