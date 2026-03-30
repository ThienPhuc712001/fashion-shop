'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
export default function AdminCouponsPage() {
    const router = useRouter();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchCoupons();
    }, [router]);
    const fetchCoupons = async () => {
        var _a, _b, _c;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/coupons');
            setCoupons(res.data);
        }
        catch (err) {
            if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            }
            else {
                setError(((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Không thể tải mã giảm giá');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (couponId) => {
        var _a, _b;
        if (!confirm('Xóa mã giảm giá này?'))
            return;
        try {
            await api.delete(`/coupons/${couponId}`);
            toast.success('Đã xóa mã giảm giá');
            fetchCoupons();
        }
        catch (err) {
            toast.error(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Xóa thất bại');
        }
    };
    const getTypeLabel = (type) => {
        return type === 'percentage' ? 'Phần trăm' : 'Cố định';
    };
    if (loading) {
        return (<div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg"/>
      </div>);
    }
    if (error) {
        return <ErrorDisplay message={error} onRetry={fetchCoupons}/>;
    }
    return (<div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Mã giảm giá</h1>
        <Button onClick={() => router.push('/admin/coupons/new')}>
          <Plus className="h-4 w-4 mr-2"/>
          Thêm mã giảm giá
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả mã giảm giá ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Giá trị</TableHead>
                <TableHead>Đơn tối thiểu</TableHead>
                <TableHead>Giới hạn sử dụng</TableHead>
                <TableHead>Đã dùng</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (<TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>{getTypeLabel(coupon.type)}</TableCell>
                  <TableCell>
                    {coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}
                  </TableCell>
                  <TableCell>{coupon.minPurchase ? formatPrice(coupon.minPurchase) : '-'}</TableCell>
                  <TableCell>{coupon.usageLimit || 'Không giới hạn'}</TableCell>
                  <TableCell>{coupon.usedCount} / {coupon.usageLimit || '∞'}</TableCell>
                  <TableCell>{new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => router.push(`/admin/coupons/${coupon.id}/edit`)}>
                        <Pencil className="h-4 w-4"/>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(coupon.id)}>
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>))}
              {coupons.length === 0 && (<TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Chưa có mã giảm giá nào
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>);
}
