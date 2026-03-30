import request from 'supertest';
import app from '../src/app';
import db from '../src/config/database';

// Global test utilities
export const testAgent = request.agent(app);

// Test data factories
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Test Admin',
    role: 'admin',
  },
  customer: {
    email: 'customer@test.com',
    password: 'Customer123!',
    name: 'Test Customer',
  },
};

// Ensure database is connected and tables exist
export const ensureDBConnected = async () => {
  try {
    await db.get('SELECT 1');
  } catch (err) {
    console.log('  Connecting to test database...');
    // Ensure data directory exists
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'fashion_shop_test.db');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    await db.connect();
  }
  
  // Note: Tables should be created via seed script in production/test setup
  // createTables() is called by seed script, not here (avoids private API)
};

// Ensure minimal test data exists (idempotent - safe to run multiple times)
export const ensureTestData = async () => {
  const { v4: uuidv4 } = await import('uuid');
  const bcrypt = await import('bcrypt');
  
  // Ensure admin user exists
  const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [testUsers.admin.email]);
  if (!existingAdmin) {
    const adminPasswordHash = await bcrypt.hash(testUsers.admin.password, 10);
    await db.run(
      `INSERT INTO users (id, email, password_hash, full_name, role, email_verified) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), testUsers.admin.email, adminPasswordHash, testUsers.admin.name, 'admin', true]
    );
    console.log('  ✅ Admin user created');
  }
  
  // Ensure test category exists
  let category = await db.get('SELECT id FROM categories WHERE slug = ?', ['test-category']);
  let categoryId;
  if (!category) {
    categoryId = uuidv4();
    await db.run(
      `INSERT INTO categories (id, name, slug, is_active) VALUES (?, ?, ?, ?)`,
      [categoryId, 'Test Category', 'test-category', true]
    );
    console.log('  ✅ Category created');
  } else {
    categoryId = category.id;
  }
  
  // Ensure test brand exists
  let brand = await db.get('SELECT id FROM brands WHERE slug = ?', ['test-brand']);
  let brandId;
  if (!brand) {
    brandId = uuidv4();
    await db.run(
      `INSERT INTO brands (id, name, slug, is_active) VALUES (?, ?, ?, ?)`,
      [brandId, 'Test Brand', 'test-brand', true]
    );
    console.log('  ✅ Brand created');
  } else {
    brandId = brand.id;
  }
  
  // Ensure test product exists
  let product = await db.get('SELECT id FROM products WHERE slug = ?', ['test-product']);
  let productId;
  if (!product) {
    productId = uuidv4();
    await db.run(
      `INSERT INTO products (id, name, slug, description, category_id, brand_id, base_price, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, 'Test Product', 'test-product', 'Test description', categoryId, brandId, 100000, true]
    );
    console.log('  ✅ Product created');
    
    // Create variant
    const variantId = uuidv4();
    await db.run(
      `INSERT INTO product_variants (id, product_id, sku, size, color_name, stock_quantity, is_available) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [variantId, productId, 'TEST-SKU-001', 'M', 'Black', 100, true]
    );
    console.log('  ✅ Variant created');
    
    // Create image
    await db.run(
      `INSERT INTO product_images (id, product_id, url, is_primary) 
       VALUES (?, ?, ?, ?)`,
      [uuidv4(), productId, 'https://via.placeholder.com/500', true]
    );
    console.log('  ✅ Image created');
  } else {
    productId = product.id;
    
    // Ensure variant exists
    let variant = await db.get('SELECT id FROM product_variants WHERE product_id = ? LIMIT 1', [productId]);
    if (!variant) {
      const variantId = uuidv4();
      await db.run(
        `INSERT INTO product_variants (id, product_id, sku, size, color_name, stock_quantity, is_available) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [variantId, productId, 'TEST-SKU-001', 'M', 'Black', 100, true]
      );
      console.log('  ✅ Variant created (fallback)');
    }
  }
  
  console.log('✅ Test data ensured (admin, category, brand, product)');
};

// Get test IDs (cached after first call)
let cachedIds: { category_id: string; brand_id: string; product_id: string; variant_id: string } | null = null;

export const getTestIds = async () => {
  if (cachedIds) return cachedIds;
  
  const product = await db.get('SELECT id FROM products WHERE slug = ?', ['test-product']);
  if (!product) throw new Error('Test product not found. Run ensureTestData first.');
  
  const variant = await db.get('SELECT id FROM product_variants WHERE product_id = ? LIMIT 1', [product.id]);
  if (!variant) throw new Error('Test variant not found.');
  
  const category = await db.get('SELECT id FROM categories WHERE slug = ?', ['test-category']);
  const brand = await db.get('SELECT id FROM brands WHERE slug = ?', ['test-brand']);
  
  cachedIds = {
    category_id: category?.id || '',
    brand_id: brand?.id || '',
    product_id: product.id,
    variant_id: variant.id,
  };
  
  return cachedIds;
};

// Helper: Register a test user and return token + user ID (auto-cleanup friendly)
export const registerTestUser = async (email: string, password: string, name: string) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password, name });
  
  if (res.body.success) {
    return {
      token: res.body.data.token,
      refreshToken: res.body.data.refreshToken,
      user: res.body.data.user,
    };
  }
  throw new Error(`Failed to register test user: ${res.body.error}`);
};

// Helper: Create admin token (reuse admin account)
export const getAdminToken = async () => {
  // Ensure admin exists by ensuring test data
  await ensureTestData();
  
  // Login admin
  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: testUsers.admin.email,
      password: testUsers.admin.password,
    });
  
  if (res.body.success) {
    return res.body.data.token;
  }
  throw new Error('Failed to login admin: ' + res.body.error);
};
