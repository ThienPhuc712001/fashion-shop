#!/usr/bin/env node
/**
 * Quick API Test - Minimal viable tests
 */
import axios from 'axios';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const API = axios.create({ baseURL: BASE_URL });

let adminToken = '';
let customerToken = '';
let productId = '';
let variantId = '';
let cartToken = '';

async function test(name: string, fn: () => Promise<any>): Promise<boolean> {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (err: any) {
    const error = err.response?.data?.message || err.message || 'Unknown error';
    console.log(`❌ ${name}: ${error}`);
    return false;
  }
}

async function run() {
  console.log('🚀 Quick API Test\n');

  // 1. Health
  await test('GET /health', async () => {
    const res = await API.get('/health');
    if (res.status !== 200) throw new Error('Unhealthy');
  });

  // 2. API info
  await test('GET /api', async () => {
    const res = await API.get('/api');
    if (!res.data.success) throw new Error('Missing success');
  });

  // 3. Admin login
  await test('POST /api/auth/login (admin)', async () => {
    const res = await API.post('/api/auth/login', {
      email: 'admin@fashionshop.com',
      password: 'admin123'
    });
    if (!res.data.success) throw new Error('Login failed');
    adminToken = res.data.data.token;
  });

  // 4. Get list products and pick one with variants
  let productList: any[] = [];
  await test('GET /api/products (list)', async () => {
    const res = await API.get('/api/products?limit=10');
    if (!res.data.success) throw new Error('Failed');
    productList = res.data.data.products || res.data.data;
    if (!Array.isArray(productList) || productList.length === 0) throw new Error('No products');
  });

  // 5. Find product with variants
  let selectedProductId = '';
  for (const p of productList) {
    try {
      const vRes = await API.get(`/api/products/${p.id}/variants`);
      if (vRes.data.success && vRes.data.data && vRes.data.data.length > 0) {
        selectedProductId = p.id;
        console.log(`   → Selected product: ${p.name} (${p.id}) with ${vRes.data.data.length} variants`);
        break;
      }
    } catch (e) {
      // ignore and continue
    }
  }
  if (!selectedProductId) throw new Error('No product with variants found');

  // 6. Get first variant
  await test('GET /api/products/:id/variants', async () => {
    const res = await API.get(`/api/products/${selectedProductId}/variants`);
    if (!res.data.success) throw new Error('Failed');
    if (!res.data.data.length) throw new Error('No variants');
    variantId = res.data.data[0].id;
  });

  // 6. Create cart session
  await test('POST /api/cart/session', async () => {
    const res = await API.post('/api/cart/session');
    if (!res.data.success) throw new Error('Failed');
    cartToken = res.data.data.session_token;
  });

  // 7. Add to cart
  await test('POST /api/cart/items (guest)', async () => {
    const res = await API.post('/api/cart/items', {
      variant_id: variantId,
      quantity: 2
    }, {
      headers: { 'X-Cart-Token': cartToken }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // 8. Get cart
  await test('GET /api/cart (guest)', async () => {
    const res = await API.get('/api/cart', {
      headers: { 'X-Cart-Token': cartToken }
    });
    if (!res.data.success) throw new Error('Failed');
    if (res.data.data.items.length === 0) throw new Error('Cart empty');
  });

  // 9. Create order (guest)
  await test('POST /api/orders (guest)', async () => {
    const res = await API.post('/api/orders', {
      email: 'guest@test.com',
      shipping_address: {
        recipient_name: 'Guest Test',
        phone: '0901234567',
        province: 'HCM',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        street_address: '123 Nguyễn Huệ'
      },
      shipping_method: 'standard',
      payment_method: 'cod'
    }, {
      headers: { 'X-Cart-Token': cartToken }
    });
    if (!res.data.success) throw new Error('Order failed');
    console.log(`   → Order #: ${res.data.data.order.order_number}`);
  });

  // 10. Coupon
  await test('POST /api/coupons/validate', async () => {
    const res = await API.post('/api/coupons/validate', {
      code: 'TEST10',
      order_amount: 200000
    });
    if (!res.data.success) throw new Error('Validation failed');
  });

  // 11. Dashboard
  await test('GET /api/admin/dashboard/stats', async () => {
    const res = await API.get('/api/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  console.log('\n✅ Quick test completed!');
  process.exit(0);
}

run().catch(err => {
  console.error('Runner failed:', err);
  process.exit(1);
});
