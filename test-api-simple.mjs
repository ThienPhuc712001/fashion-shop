#!/usr/bin/env node
/**
 * Simple API Test Script
 * Tests all major endpoints
 */
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API = axios.create({ baseURL: BASE_URL });

// Test results
const results: any = { passed: 0, failed: 0, tests: [] };

async function test(name: string, fn: () => Promise<any>) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: 'PASSED' });
    console.log(`✅ ${name}`);
  } catch (err: any) {
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: err.message });
    console.log(`❌ ${name}: ${err.message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  // 1. Health check
  await test('GET /health', async () => {
    const res = await API.get('/health');
    if (res.status !== 200) throw new Error('Health check failed');
  });

  // 2. API info
  await test('GET /api', async () => {
    const res = await API.get('/api');
    if (!res.data.success) throw new Error('API info failed');
  });

  // 3. Categories
  await test('GET /api/categories (public)', async () => {
    const res = await API.get('/api/categories');
    if (!res.data.success) throw new Error('List categories failed');
  });

  await test('GET /api/categories/:id (public)', async () => {
    const res = await API.get('/api/categories');
    const categories = res.data.data;
    if (categories.length === 0) throw new Error('No categories to test');
    const catRes = await API.get(`/api/categories/${categories[0].id}`);
    if (!catRes.data.success) throw new Error('Get category failed');
  });

  // 4. Brands
  await test('GET /api/brands (public)', async () => {
    const res = await API.get('/api/brands');
    if (!res.data.success) throw new Error('List brands failed');
  });

  await test('GET /api/brands/:id (public)', async () => {
    const res = await API.get('/api/brands');
    const brands = res.data.data;
    if (brands.length === 0) throw new Error('No brands to test');
    const brandRes = await API.get(`/api/brands/${brands[0].id}`);
    if (!brandRes.data.success) throw new Error('Get brand failed');
  });

  // 5. Auth endpoints (public)
  await test('POST /api/auth/register (should fail without data)', async () => {
    try {
      await API.post('/api/auth/register');
      throw new Error('Should have thrown validation error');
    } catch (err: any) {
      if (err.response?.status !== 400) throw new Error('Expected 400');
    }
  });

  await test('POST /api/auth/login (should fail without data)', async () => {
    try {
      await API.post('/api/auth/login');
      throw new Error('Should have thrown validation error');
    } catch (err: any) {
      if (err.response?.status !== 400) throw new Error('Expected 400');
    }
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('='.repeat(50));

  if (results.failed > 0) {
    console.log('\nFailed tests:');
    results.tests.filter((t: any) => t.status === 'FAILED').forEach((t: any) => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
  }

  // Write results to file
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\n📄 Results saved to test-results.json');

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
