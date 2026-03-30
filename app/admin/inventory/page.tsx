'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Variant {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  size?: string;
  color_name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: number;
}

export default function InventoryPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly, search]);

  const fetchInventory = async () => {
    try {
      const params: any = {};
      if (lowStockOnly) params.lowStock = true;
      if (search) params.search = search;
      const response = await api.get('/admin/inventory', { params });
      setVariants(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.response?.data?.message || 'Không thể tải kho hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStockBadge = (stock: number, threshold: number) => {
    if (stock === 0) return { variant: 'destructive' as const, text: 'Hết hàng' };
    if (stock <= threshold) return { variant: 'default' as const, text: 'Sắp hết' };
    return { variant: 'secondary' as const, text: 'Có hàng' };
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
          <Button onClick={fetchInventory}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kho hàng</h1>
          <p className="text-muted-foreground">Quản lý tồn kho sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button
            variant={lowStockOnly ? 'default' : 'outline'}
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            {lowStockOnly ? 'Tất cả' : 'Sắp hết'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tồn kho ({variants.length} biến thể)</CardTitle>
          <CardDescription>
            {variants.filter(v => v.stock_quantity === 0).length} đã hết hàng,{' '}
            {variants.filter(v => v.stock_quantity <= v.low_stock_threshold).length} sắp hết
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Màu</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                variants.map((variant) => {
                  const stockStatus = getStockBadge(variant.stock_quantity, variant.low_stock_threshold);
                  return (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">{variant.product_name}</TableCell>
                      <TableCell className="font-mono text-xs">{variant.sku}</TableCell>
                      <TableCell>{variant.size || '-'}</TableCell>
                      <TableCell>{variant.color_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          value={variant.stock_quantity}
                          className="w-20 h-8"
                          onChange={async (e) => {
                            const newQty = parseInt(e.target.value) || 0;
                            try {
                              await api.patch(`/admin/inventory/${variant.id}`, {
                                stock_quantity: newQty
                              });
                              variant.stock_quantity = newQty;
                              setVariants([...variants]);
                            } catch (err) {
                              alert('Cập nhật thất bại');
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.text}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
