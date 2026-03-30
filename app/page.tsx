import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/products/product-card';
import api from '@/lib/api';

// Temporarily hardcoded until API is connected
const featuredProducts = [
  {
    id: '1',
    name: 'Áo khoác bomber',
    slug: 'ao-khoac-bomber',
    description: 'Áo khoác bomber polyester chất lượng cao, thiết kế thể thao, phù hợp đi chơi và dạo phố.',
    price: 899000,
    compareAtPrice: 1299000,
    images: ['/images/products/placeholder.jpg'],
    category: { id: '1', name: 'Nam', slug: 'nam' },
    variants: [],
    rating: 4.5,
    reviewCount: 12,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Váy maxi hoa hồng',
    slug: 'vay-maxi-hoa-hong',
    description: 'Váy maxi dài, chất liệu linen mềm mại, họa tiết hoa hồng nhẹ nhàng, sang trọng.',
    price: 1250000,
    images: ['/images/products/placeholder.jpg'],
    category: { id: '2', name: 'Nữ', slug: 'nu' },
    variants: [],
    rating: 4.8,
    reviewCount: 28,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Túi xách da bò',
    slug: 'tui-xach-da-bo',
    description: 'Túi xách làm từ da bò thật, thiết kế đơn giản nhưng tinh tế, nhiều ngăn tiện dụng.',
    price: 2500000,
    compareAtPrice: 3200000,
    images: ['/images/products/placeholder.jpg'],
    category: { id: '3', name: 'Phụ kiện', slug: 'phu-kien' },
    variants: [],
    rating: 4.9,
    reviewCount: 45,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export default async function HomePage() {
  // In production, fetch featured products from API
  // const { data } = await api.get('/products?featured=true&limit=8');
  // const products = data.data;

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden bg-gradient-to-r from-zinc-900 to-zinc-700">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
        <div className="container relative mx-auto flex h-full items-center px-4">
          <div className="max-w-2xl space-y-6 text-white">
            <h1 className="text-5xl font-bold leading-tight md:text-6xl">
              Phong cách <span className="text-amber-500">độc bản</span> của bạn
            </h1>
            <p className="text-lg md:text-xl text-zinc-300">
              Khám phá bộ sưu tập mới nhất với những thiết kế đầy tâm huyết.
              Chất liệu cao cấp, đường kim mũi chỉ tỉ mỉ.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild className="bg-amber-500 hover:bg-amber-600 text-black">
                <Link href="/products">Mua ngay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white hover:text-zinc-900">
                <Link href="/products?category=nam&category=nu">Xem bộ sưu tập</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">Danh mục</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <Link href="/products?category=nam" className="group relative overflow-hidden rounded-lg">
            <div className="aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <span className="text-2xl font-bold text-white">Nam</span>
            </div>
          </Link>
          <Link href="/products?category=nu" className="group relative overflow-hidden rounded-lg">
            <div className="aspect-[4/3] bg-gradient-to-br from-rose-800 to-rose-900" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <span className="text-2xl font-bold text-white">Nữ</span>
            </div>
          </Link>
          <Link href="/products?category=phu-kien" className="group relative overflow-hidden rounded-lg">
            <div className="aspect-[4/3] bg-gradient-to-br from-amber-700 to-amber-900" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <span className="text-2xl font-bold text-white">Phụ kiện</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Sản phẩm nổi bật</h2>
          <Button variant="link" asChild>
            <Link href="/products">Xem tất cả</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Promo Banner */}
      <section className="bg-zinc-100 dark:bg-zinc-800">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Giảm giá lên đến 30%</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Chỉ trong thời gian giới hạn. Đừng bỏ lỡ cơ hội sở hữu những món đồ thời trang yêu thích.
            </p>
            <Button size="lg" asChild className="mt-8 bg-rose-600 hover:bg-rose-700">
              <Link href="/products">Khám phá ngay</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Chất lượng đảm bảo</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Sản phẩm được kiểm tra kỹ lưỡng, cam kết chất lượng cao cấp.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Giá cả cạnh tranh</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cam kết mang đến mức giá tốt nhất thị trường.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6">
            <div className="mb-4 rounded-full bg-primary/10 p-3">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Giao hàng toàn quốc</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Freeship cho đơn hàng trên 500k. Giao hàng nhanh toàn quốc.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
