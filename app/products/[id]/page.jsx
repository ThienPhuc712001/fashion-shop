'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingPage, ErrorDisplay } from '@/components/ui/spinner';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingCart, Heart, Minus, Plus, Star, Truck, Shield } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
export default function ProductDetailPage() {
    const params = useParams();
    const productId = params.id;
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');
    const [selectedColor, setSelectedColor] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    useEffect(() => {
        const fetchProduct = async () => {
            var _a, _b;
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/products/${productId}`);
                setProduct(response.data);
                // Set default variant values if available
                if (response.data.variants && response.data.variants.length > 0) {
                    const firstVariant = response.data.variants[0];
                    setSelectedSize(firstVariant.size);
                    setSelectedColor(firstVariant.color);
                }
            }
            catch (err) {
                setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể tải sản phẩm');
            }
            finally {
                setLoading(false);
            }
        };
        if (productId) {
            fetchProduct();
        }
    }, [productId]);
    const handleAddToCart = async () => {
        var _a, _b;
        if (!product) {
            toast.error('Sản phẩm không tồn tại');
            return;
        }
        if (!selectedSize || !selectedColor) {
            toast.error('Vui lòng chọn size và màu sắc');
            return;
        }
        const variant = product.variants.find((v) => v.size === selectedSize && v.color === selectedColor);
        if (!variant) {
            toast.error('Biến thể không tồn tại');
            return;
        }
        if (variant.stock < quantity) {
            toast.error('Số lượng không đủ trong kho');
            return;
        }
        try {
            await api.post('/cart/items', {
                productId: product.id,
                variantId: variant.id,
                quantity,
            });
            toast.success('Đã thêm vào giỏ hàng');
        }
        catch (err) {
            toast.error(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể thêm vào giỏ hàng');
        }
    };
    const getUniqueSizes = () => {
        if (!product)
            return [];
        const sizes = new Set(product.variants.map((v) => v.size));
        return Array.from(sizes);
    };
    const getUniqueColors = () => {
        if (!product)
            return [];
        const colors = new Set(product.variants.map((v) => v.color));
        return Array.from(colors);
    };
    const getStockForVariant = (size, color) => {
        if (!product)
            return 0;
        const variant = product.variants.find((v) => v.size === size && v.color === color);
        return (variant === null || variant === void 0 ? void 0 : variant.stock) || 0;
    };
    if (loading) {
        return <LoadingPage />;
    }
    if (error || !product) {
        return <ErrorDisplay message={error || 'Sản phẩm không tồn tại'}/>;
    }
    return (<div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-100">
            {product.images && product.images.length > 0 ? (<Image src={product.images[selectedImage]} alt={product.name} fill className="object-cover" priority/>) : (<div className="flex h-full items-center justify-center">
                <span className="text-zinc-400">No image</span>
              </div>)}
            {product.compareAtPrice && product.compareAtPrice > product.price && (<div className="absolute left-4 top-4 rounded bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
              </div>)}
          </div>
          {product.images && product.images.length > 1 && (<div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (<button key={index} onClick={() => setSelectedImage(index)} className={`relative aspect-square overflow-hidden rounded-md border-2 ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}>
                  <Image src={image} alt={`${product.name} - ${index + 1}`} fill className="object-cover"/>
                </button>))}
            </div>)}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Link href={`/products?category=${product.category.slug}`}>
              <span className="text-sm text-muted-foreground hover:text-primary">
                {product.category.name}
              </span>
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (<Star key={i} className={`h-5 w-5 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-current' : 'text-zinc-300'}`}/>))}
                <span className="ml-2 text-sm text-muted-foreground">
                  ({product.reviewCount || 0} đánh giá)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (<span className="text-xl text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>)}
          </div>

          <Separator />

          {/* Variants */}
          <div className="space-y-4">
            {/* Size Selection */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Size</h3>
              <div className="flex flex-wrap gap-2">
                {getUniqueSizes().map((size) => (<Button key={size} variant={selectedSize === size ? 'default' : 'outline'} size="sm" onClick={() => setSelectedSize(size)} disabled={getStockForVariant(size, selectedColor) === 0}>
                    {size}
                  </Button>))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Màu sắc</h3>
              <div className="flex flex-wrap gap-2">
                {getUniqueColors().map((color) => {
            const stock = getStockForVariant(selectedSize, color);
            return (<Button key={color} variant={selectedColor === color ? 'default' : 'outline'} size="sm" onClick={() => setSelectedColor(color)} disabled={stock === 0} className="capitalize">
                      {color}
                      {stock === 0 && ' (Hết)'}
                    </Button>);
        })}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="mb-2 text-sm font-medium">Số lượng</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                  <Minus className="h-4 w-4"/>
                </Button>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 text-center"/>
                <Button variant="outline" size="icon" onClick={() => setQuantity((q) => q + 1)}>
                  <Plus className="h-4 w-4"/>
                </Button>
                <span className="text-sm text-muted-foreground ml-4">
                  Còn {getStockForVariant(selectedSize, selectedColor)} sản phẩm
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Add to Cart */}
          <div className="flex gap-4">
            <Button size="lg" className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-5 w-5"/>
              Thêm vào giỏ
            </Button>
            <Button size="lg" variant="outline" onClick={() => setIsWishlisted(!isWishlisted)}>
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}/>
            </Button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-5 w-5"/>
              <span>Freeship từ 500k</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-5 w-5"/>
              <span>Bảo hành chính hãng</span>
            </div>
          </div>

          {/* Description */}
          <Tabs defaultValue="description" className="mt-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Mô tả</TabsTrigger>
              <TabsTrigger value="details">Chi tiết</TabsTrigger>
              <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <div className="prose max-w-none">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="font-medium">Danh mục</dt>
                      <dd className="text-muted-foreground">{product.category.name}</dd>
                    </div>
                    {product.brand && (<div>
                        <dt className="font-medium">Thương hiệu</dt>
                        <dd className="text-muted-foreground">{product.brand.name}</dd>
                      </div>)}
                    <div>
                      <dt className="font-medium">Ngày tạo</dt>
                      <dd className="text-muted-foreground">{formatDate(product.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">SKUs</dt>
                      <dd className="text-muted-foreground">{product.variants.length} biến thể</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground text-center py-4">
                    Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>);
}
