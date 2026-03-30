'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
export default function AdminCategoriesPage() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchCategories();
    }, [router]);
    const fetchCategories = async () => {
        var _a, _b, _c;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/categories');
            setCategories(res.data);
        }
        catch (err) {
            if (((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                localStorage.removeItem('token');
                router.push('/login');
            }
            else {
                setError(((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || 'Không thể tải danh mục');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async (categoryId) => {
        var _a, _b;
        if (!confirm('Xóa danh mục này?'))
            return;
        try {
            await api.delete(`/categories/${categoryId}`);
            toast.success('Đã xóa danh mục');
            fetchCategories();
        }
        catch (err) {
            toast.error(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Xóa thất bại');
        }
    };
    if (loading) {
        return (<div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg"/>
      </div>);
    }
    if (error) {
        return <ErrorDisplay message={error} onRetry={fetchCategories}/>;
    }
    return (<div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Danh mục</h1>
        <Button onClick={() => router.push('/admin/categories/new')}>
          <Plus className="h-4 w-4 mr-2"/>
          Thêm danh mục
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả danh mục ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Sắp xếp</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (<TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>{cat.slug}</TableCell>
                  <TableCell>{cat.description || '-'}</TableCell>
                  <TableCell>{cat.sort_order}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => router.push(`/admin/categories/${cat.id}/edit`)}>
                        <Pencil className="h-4 w-4"/>
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>))}
              {categories.length === 0 && (<TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chưa có danh mục nào
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>);
}
