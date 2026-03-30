'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ErrorDisplay, LoadingOverlay, LoadingPage } from '@/components/ui/spinner';
import { formatPrice } from '@/lib/utils';
import { CreditCard, Check } from 'lucide-react';
import api from '@/lib/api';
export default function CheckoutPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState('shipping');
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    // Shipping info
    const [shippingInfo, setShippingInfo] = useState({
        name: '',
        phone: '',
        email: '',
        street: '',
        city: '',
        state: '',
        country: 'Việt Nam',
        zipCode: '',
    });
    // Payment method
    const [paymentMethod, setPaymentMethod] = useState('cod');
    // Coupon
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState(null);
    // Addresses
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const steps = [
        { id: 'shipping', name: 'Địa chỉ' },
        { id: 'payment', name: 'Thanh toán' },
        { id: 'review', name: 'Xác nhận' },
    ];
    useEffect(() => {
        fetchCart();
        fetchAddresses();
    }, []);
    const fetchCart = async () => {
        var _a, _b;
        try {
            const response = await api.get('/cart');
            setCart(response.data);
            if (response.data.items.length === 0) {
                router.push('/cart');
            }
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể tải giỏ hàng');
        }
        finally {
            setLoading(false);
        }
    };
    const fetchAddresses = async () => {
        try {
            const response = await api.get('/addresses');
            setAddresses(response.data);
            const defaultAddress = response.data.find((a) => a.isDefault);
            if (defaultAddress) {
                setSelectedAddressId(defaultAddress.id);
                setShippingInfo({
                    name: defaultAddress.name,
                    phone: defaultAddress.phone,
                    email: '',
                    street: defaultAddress.street,
                    city: defaultAddress.city,
                    state: defaultAddress.state,
                    country: defaultAddress.country,
                    zipCode: defaultAddress.zipCode,
                });
            }
        }
        catch (_a) {
            // User might not be logged in, addresses not required for guest
        }
    };
    const applyCoupon = async () => {
        var _a, _b;
        if (!couponCode.trim())
            return;
        setCouponError(null);
        try {
            const response = await api.post('/coupons/validate', { code: couponCode });
            setAppliedCoupon(response.data);
        }
        catch (err) {
            setCouponError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Mã giảm giá không hợp lệ');
        }
    };
    const calculateTotals = () => {
        if (!cart)
            return { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0 };
        let subtotal = cart.subtotal;
        let discount = 0;
        if (appliedCoupon) {
            if (appliedCoupon.type === 'percentage') {
                discount = subtotal * (appliedCoupon.value / 100);
                if (appliedCoupon.maxDiscount) {
                    discount = Math.min(discount, appliedCoupon.maxDiscount);
                }
            }
            else {
                discount = appliedCoupon.value;
            }
        }
        const afterDiscount = subtotal - discount;
        const shipping = afterDiscount >= 500000 ? 0 : 30000;
        const tax = afterDiscount * 0.1;
        return {
            subtotal,
            discount,
            shipping,
            tax,
            total: afterDiscount + shipping + tax,
        };
    };
    const totals = calculateTotals();
    const handleSubmit = async () => {
        var _a, _b;
        setSubmitting(true);
        setError(null);
        try {
            const orderData = {
                items: (cart === null || cart === void 0 ? void 0 : cart.items.map((item) => ({
                    productId: item.product.id,
                    variantId: item.variant.id,
                    quantity: item.quantity,
                    price: item.product.price,
                }))) || [],
                shippingAddress: selectedAddressId
                    ? addresses.find((a) => a.id === selectedAddressId) || Object.assign(Object.assign({}, shippingInfo), { isDefault: false })
                    : Object.assign(Object.assign({}, shippingInfo), { isDefault: false }),
                billingAddress: Object.assign(Object.assign({}, shippingInfo), { isDefault: false }),
                subtotal: totals.subtotal,
                tax: totals.tax,
                shipping: totals.shipping,
                discount: totals.discount,
                total: totals.total,
                paymentMethod,
                notes: '',
            };
            const response = await api.post('/orders', orderData);
            const order = response.data;
            // Clear cart
            await api.delete('/cart/items');
            // Handle payment redirect for Momo/VNPay
            if (paymentMethod === 'momo' || paymentMethod === 'vnpay') {
                // Assuming BE returns payment_url in order data
                const paymentUrl = order.payment_url;
                if (paymentUrl) {
                    window.location.href = paymentUrl;
                    return;
                }
            }
            // For COD or if no payment URL, redirect to success
            router.push(`/order/${order.orderNumber}/success`);
        }
        catch (err) {
            setError(((_b = (_a = err.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Không thể đặt hàng');
            setSubmitting(false);
        }
    };
    const isStepValid = () => {
        switch (currentStep) {
            case 'shipping':
                return (selectedAddressId || (shippingInfo.name &&
                    shippingInfo.phone &&
                    shippingInfo.email &&
                    shippingInfo.street &&
                    shippingInfo.city &&
                    shippingInfo.zipCode));
            case 'payment':
                return paymentMethod === 'cod' || paymentMethod === 'momo' || paymentMethod === 'vnpay';
            case 'review':
                return true;
            default:
                return false;
        }
    };
    if (loading) {
        return <LoadingPage />;
    }
    if (error || !cart) {
        return <ErrorDisplay message={error || 'Giỏ hàng không tồn tại'} onRetry={() => fetchCart()}/>;
    }
    return (<div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Thanh toán</h1>

      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (<div key={step.id} className="flex items-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${currentStep === step.id
                ? 'bg-primary text-primary-foreground'
                : steps.findIndex((s) => s.id === currentStep) > index
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground'}`}>
                {steps.findIndex((s) => s.id === currentStep) > index ? (<Check className="h-5 w-5"/>) : (index + 1)}
              </div>
              <span className={`ml-2 hidden sm:block ${currentStep === step.id ? 'font-semibold' : ''}`}>
                {step.name}
              </span>
              {index < steps.length - 1 && (<div className="mx-4 h-0.5 w-12 sm:w-24 bg-muted"/>)}
            </div>))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 'shipping' && 'Địa chỉ giao hàng'}
                {currentStep === 'payment' && 'Phương thức thanh toán'}
                {currentStep === 'review' && 'Xác nhận đơn hàng'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStep === 'shipping' && (<div className="space-y-6">
                  {/* Saved Addresses */}
                  {addresses.length > 0 && (<div className="space-y-3">
                      <h3 className="text-sm font-medium">Địa chỉ đã lưu</h3>
                      {addresses.map((address) => (<label key={address.id} className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer ${selectedAddressId === address.id ? 'border-primary bg-primary/5' : ''}`}>
                          <input type="radio" name="address" checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} className="mt-1"/>
                          <div>
                            <p className="font-medium">{address.name}</p>
                            <p className="text-sm text-muted-foreground">{address.phone}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.street}, {address.city}, {address.state} {address.zipCode}
                            </p>
                          </div>
                        </label>))}
                    </div>)}

                  <Separator />

                  {/* New Address Form */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Địa chỉ mới</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Họ và tên *</label>
                        <Input value={shippingInfo.name} onChange={(e) => setShippingInfo(Object.assign(Object.assign({}, shippingInfo), { name: e.target.value }))} placeholder="Nguyễn Văn A" disabled={!!selectedAddressId}/>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Số điện thoại *</label>
                        <Input value={shippingInfo.phone} onChange={(e) => setShippingInfo(Object.assign(Object.assign({}, shippingInfo), { phone: e.target.value }))} placeholder="0901234567" disabled={!!selectedAddressId}/>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <Input type="email" value={shippingInfo.email} onChange={(e) => setShippingInfo(Object.assign(Object.assign({}, shippingInfo), { email: e.target.value }))} placeholder="email@example.com" disabled={!!selectedAddressId}/>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium mb-1 block">Địa chỉ *</label>
                        <Input value={shippingInfo.street} onChange={(e) => setShippingInfo(Object.assign(Object.assign({}, shippingInfo), { street: e.target.value }))} placeholder="123 Đường Nguyễn Huệ" disabled={!!selectedAddressId}/>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Tỉnh/Thành phố *</label>
                        <Input value={shippingInfo.city} onChange={(e) => setShippingInfo(Object.assign(Object.assign({}, shippingInfo), { city: e.target.value }))} placeholder="Hồ Chí Minh" disabled={!!selectedAddressId}/>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Quận/Huyện *</label>
                        <Input value={shippingInfo.state} onChange={(e) => setShippingInfo(Object.assign(Object.assign({}, shippingInfo), { state: e.target.value }))} placeholder="Quận 1" disabled={!!selectedAddressId}/>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Mã zip</label>
                        <Input value={shippingInfo.zipCode} onChange={(e) => setShippingInfo(Object.assign(Object.assign({}, shippingInfo), { zipCode: e.target.value }))} placeholder="70000" disabled={!!selectedAddressId}/>
                      </div>
                    </div>
                  </div>
                </div>)}

              {currentStep === 'payment' && (<div className="space-y-4">
                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')}/>
                    <div className="flex-1">
                      <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                      <p className="text-sm text-muted-foreground">Thanh toán bằng tiền mặt khi nhận hàng</p>
                    </div>
                    <CreditCard className="h-5 w-5 text-muted-foreground"/>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'momo' ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="radio" name="payment" value="momo" checked={paymentMethod === 'momo'} onChange={() => setPaymentMethod('momo')}/>
                    <div className="flex-1">
                      <p className="font-medium">Ví MoMo</p>
                      <p className="text-sm text-muted-foreground">Thanh toán qua ví điện tử MoMo</p>
                    </div>
                    <img src="/images/payments/momo.svg" alt="MoMo" className="h-6 w-auto"/>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer ${paymentMethod === 'vnpay' ? 'border-primary bg-primary/5' : ''}`}>
                    <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')}/>
                    <div className="flex-1">
                      <p className="font-medium">VNPay</p>
                      <p className="text-sm text-muted-foreground">Thanh toán qua cổng VNPay</p>
                    </div>
                    <img src="/images/payments/vnpay.svg" alt="VNPay" className="h-6 w-auto"/>
                  </label>
                </div>)}

              {currentStep === 'review' && (<div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Địa chỉ giao hàng</h3>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-medium">{shippingInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{shippingInfo.phone}</p>
                      <p className="text-sm text-muted-foreground">{shippingInfo.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {shippingInfo.street}, {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Phương thức thanh toán</h3>
                    <p className="capitalize">
                      {paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : paymentMethod.toUpperCase()}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Mã giảm giá</h3>
                    {appliedCoupon ? (<div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                        <Check className="h-4 w-4 text-green-600"/>
                        <span className="text-sm">{appliedCoupon.code} (-{formatPrice(totals.discount)})</span>
                        <Button variant="ghost" size="sm" onClick={() => setAppliedCoupon(null)} className="ml-auto h-6 text-xs">
                          Xóa
                        </Button>
                      </div>) : (<div className="flex gap-2">
                        <Input placeholder="Nhập mã giảm giá" value={couponCode} onChange={(e) => setCouponCode(e.target.value)}/>
                        <Button onClick={applyCoupon} variant="outline">
                          Áp dụng
                        </Button>
                      </div>)}
                    {couponError && <p className="text-sm text-red-600 mt-1">{couponError}</p>}
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-4">Sản phẩm đặt mua</h3>
                    <div className="space-y-4">
                      {cart.items.map((item) => (<div key={item.id} className="flex gap-4">
                          <div className="h-16 w-16 rounded bg-zinc-100 overflow-hidden flex-shrink-0">
                            {item.product.images[0] && (<img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover"/>)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Size: {item.variant.size} | Màu: {item.variant.color}
                            </p>
                            <p className="text-sm">x{item.quantity}</p>
                          </div>
                          <div className="font-medium">
                            {formatPrice(item.product.price * item.quantity)}
                          </div>
                        </div>))}
                    </div>
                  </div>
                </div>)}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => {
            if (currentStep === 'shipping')
                router.push('/cart');
            else
                setCurrentStep((prev) => {
                    const idx = steps.findIndex((s) => s.id === prev);
                    return steps[idx - 1].id;
                });
        }}>
                {currentStep === 'shipping' ? 'Quay lại giỏ hàng' : 'Quay lại'}
              </Button>
              {currentStep === 'review' ? (<Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
                </Button>) : (<Button onClick={() => {
                const idx = steps.findIndex((s) => s.id === currentStep);
                setCurrentStep(steps[idx + 1].id);
            }} disabled={!isStepValid()}>
                  Tiếp tục
                </Button>)}
            </CardFooter>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Tạm tính ({cart.items.length} sản phẩm)</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (<div className="flex justify-between text-sm text-green-600">
                  <span>Giảm giá</span>
                  <span>-{formatPrice(totals.discount)}</span>
                </div>)}
              <div className="flex justify-between text-sm">
                <span>Thuế (10%)</span>
                <span>{formatPrice(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Phí vận chuyển</span>
                <span>{totals.shipping > 0 ? formatPrice(totals.shipping) : 'Miễn phí'}</span>
              </div>
              {totals.shipping === 0 && (<p className="text-xs text-muted-foreground">Freeship cho đơn từ 500k</p>)}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Tổng cộng</span>
                <span>{formatPrice(totals.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {(submitting) && <LoadingOverlay />}
    </div>);
}
