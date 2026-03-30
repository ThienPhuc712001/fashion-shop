'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { Brand } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AdminBrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchBrands();
  }, [router]);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Brand[]>('/brands');
      setBrands(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải thương hiệu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm('Xóa thương hiệu này?')) return;
    try {
      await api.delete(`/brands/${brandId}`);
      toast.success('Đã xóa thương hiệu');
      fetchBrands();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xóa thất bại');
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
    return <ErrorDisplay message={error} onRetry={fetchBrands} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Thương hiệu</h1>
        <Button onClick={() => router.push('/admin/brands/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm thương hiệu
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả thương hiệu ({brands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand.slug}</TableCell>
                  <TableCell>{brand.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => router.push(`/admin/brands/${brand.id}/edit`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(brand.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Chưa có thương hiệu nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
