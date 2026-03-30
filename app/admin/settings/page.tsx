'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Settings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  maintenanceMode: boolean;
  emailNotifications: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    siteName: '',
    siteDescription: '',
    supportEmail: '',
    supportPhone: '',
    address: '',
    maintenanceMode: false,
    emailNotifications: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      setSettings(response.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push('/login');
        return;
      }
      setError(err.response?.data?.message || 'Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toast.success('Cài đặt đã được lưu');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchSettings}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt Hệ thống</h1>
        <p className="text-muted-foreground">Quản lý cài đặt site và thông tin liên hệ</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin Site</CardTitle>
              <CardDescription>Thông tin hiển thị trên trang web</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Tên Site</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Mô tả</Label>
                <Input
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Liên hệ</CardTitle>
              <CardDescription>Thông tin liên hệ hiển thị cho khách hàng</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supportPhone">Điện thoại hỗ trợ</Label>
                <Input
                  id="supportPhone"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cài đặt Hệ thống</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Chế độ bảo trì</Label>
                  <p className="text-sm text-muted-foreground">
                    Tắt site đối với người dùng công khai
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Thông báo Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Gửi email thông báo cho đơn hàng mới
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
