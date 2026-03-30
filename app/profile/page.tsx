'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { User, Address } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { User as UserIcon, Package, MapPin, LogOut } from 'lucide-react';
import api from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await api.get<User>('/auth/me');
      setUser(userRes.data);
      const addrRes = await api.get<Address[]>('/addresses');
      setAddresses(addrRes.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải thông tin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Đã đăng xuất');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchProfile} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Tài khoản</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2">
              <Button variant="ghost" className="w-full justify-start" disabled>
                <UserIcon className="h-4 w-4 mr-2" />
                Thông tin cá nhân
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/orders">
                  <Package className="h-4 w-4 mr-2" />
                  Đơn hàng
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" disabled>
                <MapPin className="h-4 w-4 mr-2" />
                Địa chỉ
              </Button>
              <Separator />
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Thông tin cơ bản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Họ tên</label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Số điện thoại</label>
                  <Input value={user?.phone || ''} disabled />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Vai trò</label>
                  <Input value={user?.role === 'admin' ? 'Admin' : 'Khách hàng'} disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Địa chỉ</CardTitle>
              <CardDescription>Danh sách địa chỉ của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <p className="text-muted-foreground">Chưa có địa chỉ nào.</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="rounded border p-4">
                      <p className="font-semibold">{addr.name} {addr.isDefault && <span className="text-primary">(Mặc định)</span>}</p>
                      <p className="text-sm text-muted-foreground">{addr.phone}</p>
                      <p className="text-sm">{addr.street}, {addr.city}, {addr.state} {addr.zipCode}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
