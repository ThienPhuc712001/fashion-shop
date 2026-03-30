'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { Product } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
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

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Product[]>('/products?limit=100');
      setProducts(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
      } else {
        setError(err.response?.data?.message || 'Không thể tải sản phẩm');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Xóa sản phẩm này?')) return;
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Đã xóa sản phẩm');
      fetchProducts();
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
    return <ErrorDisplay message={error} onRetry={fetchProducts} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý sản phẩm</h1>
        <Button onClick={() => router.push('/admin/products/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả sản phẩm ({products.length})</CardTitle>
          <CardDescription>Quản lý sản phẩm, biến thể, hình ảnh</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Ảnh</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-12 w-12 bg-zinc-100 rounded overflow-hidden">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category?.name || '-'}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>
                    {product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => router.push(`/admin/products/${product.id}/edit`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
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
