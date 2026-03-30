'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Spinner, ErrorDisplay } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Category, Brand } from '@/lib/api';
import api from '@/lib/api';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ProductVariant {
  id?: string;
  size: string;
  color: string;
  stock: number;
  sku?: string;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId: string;
  price: number;
  comparePrice?: number;
  isActive: boolean;
  variants: ProductVariant[];
  images: File[];
  imageUrls: string[]; // existing images for edit
}

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!productId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    brandId: '',
    price: 0,
    comparePrice: undefined,
    isActive: true,
    variants: [],
    images: [],
    imageUrls: [],
  });

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    if (isEdit) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const res = await api.get<Category[]>('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get<Brand[]>('/brands');
      setBrands(res.data);
    } catch (err) {
      console.error('Failed to fetch brands', err);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      const product = res.data;
      setForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        categoryId: product.category_id || '',
        brandId: product.brand_id || '',
        price: product.base_price,
        comparePrice: product.compare_price,
        isActive: product.is_active === 1,
        variants: product.variants || [],
        images: [],
        imageUrls: product.images || [],
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = () => {
    setForm({
      ...form,
      variants: [
        ...form.variants,
        { size: '', color: '', stock: 0, sku: '' }
      ]
    });
  };

  const handleVariantChange = (index: number, field: keyof ProductVariant, value: string | number) => {
    const newVariants = [...form.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setForm({ ...form, variants: newVariants });
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = form.variants.filter((_, i) => i !== index);
    setForm({ ...form, variants: newVariants });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setForm({ ...form, images: [...form.images, ...files] });
    }
  };

  const removeImage = (index: number) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
  };

  const removeExistingImage = (url: string) => {
    setForm({ ...form, imageUrls: form.imageUrls.filter(u => u !== url) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create/update product
      const productData = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        description: form.description,
        category_id: form.categoryId,
        brand_id: form.brandId,
        base_price: form.price,
        compare_price: form.comparePrice,
        is_active: form.isActive ? 1 : 0,
      };

      let productIdResult = productId;
      if (isEdit) {
        await api.put(`/products/${productId}`, productData);
      } else {
        const res = await api.post('/products', productData);
        productIdResult = res.data.id;
      }

      // Upload images first (if any)
      for (const file of form.images) {
        const imgForm = new FormData();
        imgForm.append('image', file);
        await api.post(`/products/${productIdResult}/images`, imgForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Manage variants
      if (isEdit) {
        // Delete all old variants and create new ones (simplify)
        // In production, should diff and update
        for (const variant of form.variants) {
          if (variant.id) {
            await api.put(`/products/${productIdResult}/variants/${variant.id}`, {
              size: variant.size,
              color: variant.color,
              stock: variant.stock,
              sku: variant.sku,
            });
          } else {
            await api.post(`/products/${productIdResult}/variants`, {
              size: variant.size,
              color: variant.color,
              stock: variant.stock,
              sku: variant.sku,
            });
          }
        }
      } else {
        for (const variant of form.variants) {
          await api.post(`/products/${productIdResult}/variants`, {
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            sku: variant.sku,
          });
        }
      }

      toast.success(isEdit ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm');
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lưu sản phẩm');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">
        {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="name">Tên sản phẩm *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value })}
                      placeholder="Tự động tạo nếu trống"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Giá (VNĐ) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="comparePrice">Giá so sánh (khuyến mãi)</Label>
                    <Input
                      id="comparePrice"
                      type="number"
                      min="0"
                      value={form.comparePrice || ''}
                      onChange={(e) => setForm({ ...form, comparePrice: Number(e.target.value) || undefined })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Danh mục</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="brand">Thương hiệu</Label>
                    <select
                      id="brand"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={form.brandId}
                      onChange={(e) => setForm({ ...form, brandId: e.target.value })}
                    >
                      <option value="">Chọn thương hiệu</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Biến thể (Size & Màu sắc)</CardTitle>
                <CardDescription>Thêm các lựa chọn size và màu với tồn kho</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {form.variants.map((variant, index) => (
                    <div key={index} className="flex gap-4 items-end border-b pb-4">
                      <div className="flex-1">
                        <Label>Size</Label>
                        <Input
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          placeholder="M, L, XL..."
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Màu sắc</Label>
                        <Input
                          value={variant.color}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          placeholder="Đen, Trắng..."
                        />
                      </div>
                      <div className="w-24">
                        <Label>Stock</Label>
                        <Input
                          type="number"
                          min="0"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-32">
                        <Label>SKU (optional)</Label>
                        <Input
                          value={variant.sku || ''}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveVariant(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={handleAddVariant}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm biến thể
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Upload new images */}
                  <div>
                    <Label>Upload ảnh mới</Label>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {form.images.map((file, idx) => (
                        <div key={idx} className="relative h-24 w-24 rounded overflow-hidden bg-zinc-100">
                          <Image
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                            onClick={() => removeImage(idx)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <label className="h-24 w-24 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-muted">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Existing images */}
                  {form.imageUrls.length > 0 && (
                    <div>
                      <Label>Ảnh hiện tại</Label>
                      <div className="mt-2 flex flex-wrap gap-4">
                        {form.imageUrls.map((url, idx) => (
                          <div key={idx} className="relative h-24 w-24 rounded overflow-hidden bg-zinc-100">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            {isEdit && (
                              <button
                                type="button"
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                                onClick={() => removeExistingImage(url)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Xuất bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Kích hoạt</Label>
                  <Switch
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Spinner size="sm" className="mr-2" /> : null}
                  {isEdit ? 'Cập nhật' : 'Tạo sản phẩm'}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
                  Hủy
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
