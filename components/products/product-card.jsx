'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
export function ProductCard({ product }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const handleAddToCart = (e) => {
        e.preventDefault();
        // TODO: Implement add to cart
        console.log('Add to cart', product.id);
    };
    const handleToggleWishlist = (e) => {
        e.preventDefault();
        setIsWishlisted(!isWishlisted);
        // TODO: Call wishlist API
    };
    return (<Card className="group overflow-hidden">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100">
          {product.images && product.images[0] ? (<Image src={product.images[0]} alt={product.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" onLoadingComplete={() => setIsLoading(false)}/>) : (<div className="flex h-full items-center justify-center bg-zinc-200">
              <span className="text-zinc-400">No image</span>
            </div>)}
          {product.compareAtPrice && product.compareAtPrice > product.price && (<div className="absolute left-2 top-2 rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white">
              -{Math.round((1 - product.price / product.compareAtPrice) * 100)}%
            </div>)}
          <div className="absolute right-2 top-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm" onClick={handleToggleWishlist}>
              <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}/>
            </Button>
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{product.category.name}</p>
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{formatPrice(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (<span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice)}
              </span>)}
          </div>
          {product.rating !== undefined && (<div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (<svg key={i} className={`h-4 w-4 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-zinc-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>))}
              </div>
              <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
            </div>)}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" size="sm" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4"/>
          Thêm vào giỏ
        </Button>
      </CardFooter>
    </Card>);
}
