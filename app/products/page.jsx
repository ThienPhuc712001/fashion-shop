'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/products/product-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/spinner';
import { ErrorDisplay } from '@/components/ui/error-display';
import api from '@/lib/api';
import { Filter } from 'lucide-react';
function ProductsContent() {
    const searchParams = useSearchParams();
    const categoryParam = searchParams.get('category');
    const brandParam = searchParams.get('brand');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState(categoryParam ? [categoryParam] : []);
    const [selectedBrands, setSelectedBrands] = useState(brandParam ? [brandParam] : []);
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    const [sortBy, setSortBy] = useState('createdAt');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 12;
    const fetchFilters = useCallback(async () => {
        try {
            const [catRes, brandRes] = await Promise.all([
                api.get('/categories'),
                api.get('/brands'),
            ]);
            setCategories(catRes.data);
            setBrands(brandRes.data);
        }
        catch (err) {
            console.error('Failed to fetch filters:', err);
        }
    }, []);
    const fetchProducts = useCallback(async () => {
        var _a, _b;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams(Object.assign(Object.assign(Object.assign({ page: page.toString(), limit: limit.toString(), sortBy }, (selectedCategories.length > 0 && { category: selectedCategories.join(',') })), (selectedBrands.length > 0 && { brand: selectedBrands.join(',') })), { minPrice: priceRange[0].toString(), maxPrice: priceRange[1].toString() }));
            const response = await api.get('/products?' + params.toString());
            setProducts(response.data);
            // Assuming API returns pagination metadata in headers or body
            // For now, simple pagination
            setTotalPages(Math.ceil((response.data.length || 0) / limit) || 1);
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể tải sản phẩm');
        }
        finally {
            setLoading(false);
        }
    }, [page, selectedCategories, selectedBrands, priceRange, sortBy]);
    useEffect(() => {
        fetchFilters();
    }, [fetchFilters]);
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    const toggleCategory = (catId) => {
        setSelectedCategories((prev) => prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]);
        setPage(1);
    };
    const toggleBrand = (brandId) => {
        setSelectedBrands((prev) => prev.includes(brandId) ? prev.filter((b) => b !== brandId) : [...prev, brandId]);
        setPage(1);
    };
    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedBrands([]);
        setPriceRange([0, 10000000]);
        setPage(1);
    };
    const activeFiltersCount = selectedCategories.length + selectedBrands.length + (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0);
    return (<div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sản phẩm</h1>
        <Button variant="outline" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="mr-2 h-4 w-4"/>
          Bộ lọc
          {activeFiltersCount > 0 && (<span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {activeFiltersCount}
            </span>)}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Bộ lọc</h3>
                {activeFiltersCount > 0 && (<Button variant="ghost" size="sm" onClick={clearFilters}>
                    Xóa tất cả
                  </Button>)}
              </div>

              {/* Categories */}
              <div>
                <h4 className="mb-3 text-sm font-medium">Danh mục</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (<label key={cat.id} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={selectedCategories.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className="rounded border-gray-300"/>
                      <span className="text-sm">{cat.name}</span>
                    </label>))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h4 className="mb-3 text-sm font-medium">Thương hiệu</h4>
                <div className="space-y-2">
                  {brands.map((brand) => (<label key={brand.id} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={selectedBrands.includes(brand.id)} onChange={() => toggleBrand(brand.id)} className="rounded border-gray-300"/>
                      <span className="text-sm">{brand.name}</span>
                    </label>))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="mb-3 text-sm font-medium">Giá</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Min" value={priceRange[0] || ''} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="h-8"/>
                    <span>-</span>
                    <Input type="number" placeholder="Max" value={priceRange[1] || ''} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="h-8"/>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setPriceRange([0, 10000000])}>
                    Đặt lại
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {/* Sort & Results Count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Đang tải...' : `${products.length} sản phẩm`}
            </p>
            <select value={sortBy} onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
        }} className="rounded border border-input bg-background px-3 py-1 text-sm">
              <option value="createdAt">Mới nhất</option>
              <option value="priceAsc">Giá: Thấp → Cao</option>
              <option value="priceDesc">Giá: Cao → Thấp</option>
              <option value="name">Tên A-Z</option>
            </select>
          </div>

          {loading ? (<LoadingPage />) : error ? (<ErrorDisplay message={error} onRetry={() => setPage(1)}/>) : products.length === 0 ? (<div className="text-center py-12">
              <p className="text-muted-foreground">Không tìm thấy sản phẩm nào phù hợp.</p>
              <Button variant="link" onClick={clearFilters}>Xóa bộ lọc</Button>
            </div>) : (<>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (<ProductCard key={product.id} product={product}/>))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (<div className="mt-8 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Trước
                  </Button>
                  <span className="flex items-center px-3 text-sm">
                    Trang {page} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Tiếp
                  </Button>
                </div>)}
            </>)}
        </div>
      </div>
    </div>);
}
export default function ProductsPage() {
    return (<Suspense fallback={<LoadingPage />}>
      <ProductsContent />
    </Suspense>);
}
