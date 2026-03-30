import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';
export function Footer() {
    const currentYear = new Date().getFullYear();
    return (<footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fashion Shop</h3>
            <p className="text-sm text-muted-foreground">
              Your destination for premium fashion. Discover exclusive designs and timeless styles.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5"/>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5"/>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5"/>
              </Link>
              <Link href="mailto:contact@fashionshop.com" className="text-muted-foreground hover:text-foreground">
                <Mail className="h-5 w-5"/>
              </Link>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Mua sắm</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="text-muted-foreground hover:text-foreground">
                  Tất cả sản phẩm
                </Link>
              </li>
              <li>
                <Link href="/products?category=nam" className="text-muted-foreground hover:text-foreground">
                  Nam
                </Link>
              </li>
              <li>
                <Link href="/products?category=nu" className="text-muted-foreground hover:text-foreground">
                  Nữ
                </Link>
              </li>
              <li>
                <Link href="/products?category=phu-kien" className="text-muted-foreground hover:text-foreground">
                  Phụ kiện
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Hỗ trợ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-foreground">
                  Vận chuyển
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-foreground">
                  Đổi trả
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Công ty</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-foreground">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Điều khoản
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} Fashion Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>);
}
