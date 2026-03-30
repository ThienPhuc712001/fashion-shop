'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  is_active: number;
  created_at: string;
  order_count: number;
  address_count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'staff':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchUsers}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Người dùng</h1>
          <p className="text-muted-foreground">Xem và quản lý tất cả tài khoản người dùng</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Người dùng</CardTitle>
          <CardDescription>Quản lý tài khoản, vai trò và trạng thái</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Điện thoại</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Không có người dùng nào
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id.slice(0, 8)}...</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Hoạt động' : 'Vô hiệu'}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.order_count}</TableCell>
                    <TableCell>{user.address_count}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('vi-VN')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
