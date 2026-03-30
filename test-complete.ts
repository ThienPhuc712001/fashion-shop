#!/usr/bin/env node
/**
 * Fashion Shop API - Complete Feature Test
 * Tests all implemented features sequentially
 */
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API = axios.create({ baseURL: BASE_URL });

// Test results
interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED';
  error?: string;
}
const results = { passed: 0, failed: 0, tests: [] as TestResult[] };

async function test(name: string, fn: () => Promise<any>) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name}`);
    return true;
  } catch (err: any) {
    results.failed++;
    const error = err.response?.data?.message || err.message || 'Unknown error';
    results.tests.push({ name, status: 'FAILED', error });
    console.log(`❌ ${name}: ${error}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Fashion Shop API - Complete Feature Test\n');
  console.log('=' .repeat(60));

  // ==================== CORE ====================
  console.log('\n📦 CORE INFRASTRUCTURE');
  await test('Health Check', async () => {
    const res = await API.get('/health');
    if (res.status !== 200) throw new Error('Failed');
  });

  await test('API Info', async () => {
    const res = await API.get('/api');
    if (!res.data.success) throw new Error('Failed');
    // Check all endpoints present
    const endpoints = res.data.endpoints;
    if (!endpoints.products || !endpoints.categories || !endpoints.coupons) {
      throw new Error('Missing endpoints in API info');
    }
  });

  // ==================== AUTH ====================
  console.log('\n🔐 AUTHENTICATION');
  let adminToken = '';
  let customerToken = '';

  await test('Admin Login', async () => {
    const res = await API.post('/api/auth/login', {
      email: 'admin@fashionshop.com',
      password: 'admin123'
    });
    if (!res.data.success) throw new Error('Login failed');
    adminToken = res.data.data.token;
    if (!adminToken) throw new Error('No token');
  });

  await test('Customer Register', async () => {
    const testEmail = `test_${Date.now()}@example.com`;
    const res = await API.post('/api/auth/register', {
      email: testEmail,
      password: 'Test123456',
      full_name: 'Test User',
      phone: '0901234567'
    });
    if (!res.data.success) throw new Error('Register failed');
    customerToken = res.data.data.token;
  });

  await test('Get Current User (with token)', async () => {
    const res = await API.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  await test('Refresh Token', async () => {
    const res = await API.post('/api/auth/refresh');
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== CATEGORIES & BRANDS ====================
  console.log('\n🏷️  CATEGORIES & BRANDS');

  await test('List Categories (public)', async () => {
    const res = await API.get('/api/categories');
    if (!res.data.success) throw new Error('Failed');
  });

  await test('List Brands (public)', async () => {
    const res = await API.get('/api/brands');
    if (!res.data.success) throw new Error('Failed');
  });

  let categoryId = '';
  await test('Create Category (admin)', async () => {
    const res = await API.post('/api/categories', {
      name: 'Test Category',
      slug: 'test-category',
      description: 'Test'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
    categoryId = res.data.data.id;
  });

  await test('Update Category (admin)', async () => {
    const res = await API.put(`/api/categories/${categoryId}`, {
      name: 'Updated Category'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== PRODUCTS ====================
  console.log('\n🏷️  PRODUCTS');

  await test('List Products (public)', async () => {
    const res = await API.get('/api/products');
    if (!res.data.success) throw new Error('Failed');
  });

  await test('Filter Products by Category', async () => {
    const res = await API.get(`/api/products?category=${categoryId}`);
    if (!res.data.success) throw new Error('Failed');
  });

  let productId = '';
  await test('Create Product (admin)', async () => {
    const res = await API.post('/api/products', {
      name: 'Test Product',
      slug: 'test-product',
      description: 'Test product description',
      category_id: categoryId,
      base_price: 199000,
      is_active: true
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
    productId = res.data.data.id;
  });

  await test('Upload Product Image', async () => {
    // Create a simple test image file (1x1 red pixel)
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const FormData = require('form-data');
    const form = new FormData();
    form.append('image', testImage, { filename: 'test.png' });
    form.append('is_primary', 'true');

    const res = await API.post(`/api/upload/products/${productId}/images`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${adminToken}`
      }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== CART & CHECKOUT ====================
  console.log('\n🛒 CART & CHECKOUT');

  let cartSessionToken = '';
  await test('Create Cart Session (cookie-based)', async () => {
    const res = await API.post('/api/cart/session');
    if (!res.data.success) throw new Error('Failed');
    cartSessionToken = res.data.data.session_token;
  });

  let variantId = '';
  await test('Get Product Variants', async () => {
    const res = await API.get(`/api/products/${productId}/variants`);
    if (!res.data.success) throw new Error('Failed');
    if (res.data.data.length === 0) throw new Error('No variants');
    variantId = res.data.data[0].id;
  });

  await test('Add to Cart (guest)', async () => {
    const res = await API.post('/api/cart/items', {
      variant_id: variantId,
      quantity: 2
    }, {
      headers: { 'X-Cart-Token': cartSessionToken }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  await test('Get Cart (guest)', async () => {
    const res = await API.get('/api/cart', {
      headers: { 'X-Cart-Token': cartSessionToken }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== ORDERS ====================
  console.log('\n📦 ORDERS');

  await test('Create Order (guest checkout)', async () => {
    const shippingAddress = {
      recipient_name: 'Guest User',
      phone: '0901234567',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      street_address: '123 Đường Nguyễn Huệ'
    };

    const res = await API.post('/api/orders', {
      shipping_address: shippingAddress,
      shipping_method: 'standard',
      payment_method: 'cod',
      notes: 'Test order'
    }, {
      headers: { 'X-Cart-Token': cartSessionToken }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== COUPONS ====================
  console.log('\n🎟️  COUPONS');

  let couponId = '';
  await test('Create Coupon (admin)', async () => {
    const res = await API.post('/api/coupons', {
      code: 'TEST10',
      name: 'Test 10%',
      description: '10% discount',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 100000
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
    couponId = res.data.data.id;
  });

  await test('Validate Coupon (public)', async () => {
    const res = await API.post('/api/coupons/validate', {
      code: 'TEST10',
      order_amount: 200000
    });
    if (!res.data.success) throw new Error('Failed');
    if (res.data.data.calculated_discount !== 20000) {
      throw new Error('Wrong discount calculated');
    }
  });

  await test('List Coupons (admin)', async () => {
    const res = await API.get('/api/coupons', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== DASHBOARD ====================
  console.log('\n📊 DASHBOARD (ADMIN)');

  await test('Dashboard Stats', async () => {
    const res = await API.get('/api/admin/dashboard/stats', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  await test('Inventory Status', async () => {
    const res = await API.get('/api/admin/dashboard/inventory', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  await test('Sales Report', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await API.get(`/api/admin/dashboard/sales-report?start_date=${today}&end_date=${today}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== REVIEWS & WISHLIST ====================
  console.log('\n⭐ REVIEWS & WISHLIST');

  await test('Add to Wishlist (authenticated)', async () => {
    const res = await API.post('/api/wishlist', {
      product_id: productId
    }, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    // Can fail if product already in wishlist, treat as pass
    if (res.status === 409) return;
    if (!res.data.success) throw new Error('Failed');
  });

  await test('List Wishlist', async () => {
    const res = await API.get('/api/wishlist', {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    if (!res.data.success) throw new Error('Failed');
  });

  // ==================== SUMMARY ====================
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Summary: ${results.passed} passed, ${results.failed} failed out of ${results.passed + results.failed} tests`);
  console.log('='.repeat(60));

  if (results.failed > 0) {
    console.log('\n❌ Failed tests:');
    results.tests.filter(t => t.status === 'FAILED').forEach(t => {
      console.log(`   - ${t.name}: ${t.error}`);
    });
  } else {
    console.log('\n🎉 ALL TESTS PASSED!');
  }

  // Write results
  fs.writeFileSync(
    path.join(process.cwd(), 'fashion-shop', 'complete-test-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n📄 Results saved to complete-test-results.json');

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
