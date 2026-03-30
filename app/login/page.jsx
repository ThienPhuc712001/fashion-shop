'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ErrorDisplay, Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';
import Link from 'next/link';
import { toast } from 'sonner';
export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        var _a, _b;
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            toast.success('Đăng nhập thành công!');
            // Redirect based on role
            if (response.data.user.role === 'admin') {
                router.push('/admin');
            }
            else {
                router.push('/');
            }
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Đăng nhập thất bại');
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
          <CardDescription className="text-center">
            Nhập thông tin đăng nhập để tiếp tục
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <ErrorDisplay title="Lỗi đăng nhập" message={error}/>}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required disabled={loading}/>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Mật khẩu</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading}/>
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link href="/forgot-password" className="text-primary hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm"/> : 'Đăng nhập'}
            </Button>
            <Separator />
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>);
}
