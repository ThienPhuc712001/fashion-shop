import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle, Package } from 'lucide-react';

interface OrderSuccessPageProps {
  searchParams: Promise<{ orderNumber?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: OrderSuccessPageProps) {
  const params = await searchParams;
  const orderNumber = params.orderNumber || 'N/A';

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Đặt hàng thành công!</CardTitle>
          <p className="text-muted-foreground mt-2">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
            <p className="text-2xl font-bold tracking-wider">{orderNumber}</p>
          </div>

          <div className="space-y-2 text-left">
            <h4 className="font-semibold">Điều khoản & Hỗ trợ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Chúng tôi sẽ thông báo qua email khi đơn hàng được giao.</span>
              </li>
              <li className="flex items-start gap-2">
                <Package className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Bạn có thể theo dõi trạng thái đơn hàng trong phần "Đơn hàng" của tài khoản.</span>
              </li>
            </ul>
          </div>
        </CardContent>
        <div className="flex flex-col gap-3 p-6 pt-0">
          <Button asChild className="w-full">
            <Link href="/">Tiếp tục mua sắm</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
