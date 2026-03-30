'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ErrorDisplay, Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        var _a, _b;
        e.preventDefault();
        setError(null);
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/register', {
                name,
                email,
                password,
                phone: phone || undefined,
            });
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            router.push('/login');
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Đăng ký thất bại');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đăng ký tài khoản</CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản để mua sắm dễ dàng hơn
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <ErrorDisplay title="Lỗi đăng ký" message={error}/>}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Họ và tên</label>
              <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" required disabled={loading}/>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required disabled={loading}/>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Số điện thoại (tùy chọn)</label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" disabled={loading}/>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading}/>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Xác nhận mật khẩu</label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required disabled={loading}/>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm"/> : 'Đăng ký'}
            </Button>
            <Separator />
            <p className="text-center text-sm text-muted-foreground">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>);
}
