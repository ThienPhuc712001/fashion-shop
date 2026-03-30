import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home } from 'lucide-react';
export default function NotFound() {
    return (<div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-7xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 text-2xl font-semibold">Trang không tìm thấy</h2>
      <p className="mt-2 text-muted-foreground">
        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          <Home className="mr-2 h-4 w-4"/>
          Về trang chủ
        </Link>
      </Button>
    </div>);
}
