'use client';
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, ShoppingCart, Tag, Users, Settings, LogOut, Menu, X, } from 'lucide-react';
import { useState } from 'react';
const adminNavItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Sản phẩm', href: '/admin/products', icon: Package },
    { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Mã giảm giá', href: '/admin/coupons', icon: Tag },
    { name: 'Danh mục', href: '/admin/categories', icon: Package },
    { name: 'Thương hiệu', href: '/admin/brands', icon: Package },
    { name: 'Khách hàng', href: '/admin/users', icon: Users },
    { name: 'Cài đặt', href: '/admin/settings', icon: Settings },
];
export function AdminSidebar() {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    return (<>
      {/* Mobile toggle */}
      <Button variant="outline" size="icon" className="fixed left-4 top-4 z-50 lg:hidden" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        {isMobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
      </Button>

      {/* Overlay */}
      {isMobileOpen && (<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setIsMobileOpen(false)}/>)}

      {/* Sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0', isMobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/admin" className="text-xl font-bold">
              Fashion Shop
            </Link>
            <span className="ml-2 rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground">Admin</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {adminNavItems.map((item) => {
            const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
            return (<Link key={item.href} href={item.href}>
                  <Button variant="ghost" className={cn('w-full justify-start', isActive && 'bg-accent text-accent-foreground')} onClick={() => setIsMobileOpen(false)}>
                    <item.icon className="mr-3 h-5 w-5"/>
                    {item.name}
                  </Button>
                </Link>);
        })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4 space-y-1">
            <Link href="/" target="_blank">
              <Button variant="ghost" className="w-full justify-start">
                <Package className="mr-3 h-5 w-5"/>
                Xem cửa hàng
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50">
              <LogOut className="mr-3 h-5 w-5"/>
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>
    </>);
}
