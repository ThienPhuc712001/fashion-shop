#!/usr/bin/env node
/**
 * Database Seeder - Initialize with sample data
 */
import db from './src/config/database';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Create admin user
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await db.get(
      'SELECT id FROM users WHERE email = ?',
      ['admin@fashionshop.com']
    );

    if (!existingAdmin) {
      const adminId = uuidv4();
      await db.run(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`,
        [adminId, 'admin@fashionshop.com', hashedPassword, 'Admin User', '0901234567', 'admin', false]
      );
      console.log('✅ Admin user created: admin@fashionshop.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // 2. Seed categories if empty
    const categoriesCount = await db.get('SELECT COUNT(*) as count FROM categories');
    if (categoriesCount.count === 0) {
      const categoryData = [
        { name: 'Quần áo', slug: 'quan-ao', description: 'All clothing items', parent_id: null },
        { name: 'Giày dép', slug: 'giay-dep', description: 'Footwear', parent_id: null },
        { name: 'Túi xách', slug: 'tui-xach', description: 'Bags and accessories', parent_id: null },
        { name: 'Áo thun', slug: 'ao-thun', description: 'T-shirts', parent_id: 'parent1' },
        { name: 'Quần jeans', slug: 'quan-jeans', description: 'Jeans', parent_id: 'parent2' },
      ];

      // Generate UUIDs for parent categories first
      const parentCategories = categoryData.filter(c => c.parent_id === null);
      const childCategories = categoryData.filter(c => c.parent_id !== null);
      const parentIdMap: Record<string, string> = {};

      for (const cat of parentCategories) {
        const id = uuidv4();
        parentIdMap[cat.slug] = id;
        await db.run(
          'INSERT INTO categories (id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
          [id, cat.name, cat.slug, cat.description, null, 1, 0]
        );
      }

      // Insert children with correct parent_id
      for (const cat of childCategories) {
        const parentId = parentIdMap[cat.parent_id];
        if (!parentId) continue;
        const id = uuidv4();
        await db.run(
          'INSERT INTO categories (id, name, slug, description, parent_id, is_active, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
          [id, cat.name, cat.slug, cat.description, parentId, 1, 0]
        );
      }

      console.log('✅ Categories seeded (5 categories)');
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }

  try {
    // 3. Seed brands if empty
    const brandsCount = await db.get('SELECT COUNT(*) as count FROM brands');
    if (brandsCount.count === 0) {
      const brandNames = ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M', 'Uniqlo'];
      for (const name of brandNames) {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const id = uuidv4();
        await db.run(
          'INSERT INTO brands (id, name, slug, description, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now"), datetime("now"))',
          [id, name, slug, `Official ${name} brand`, 1]
        );
      }
      console.log('✅ Brands seeded (6 brands)');
    }
  } catch (error) {
    console.error('❌ Brand seeding failed:', error);
    throw error;
  }

  try {
    // 4. Seed products if empty (with variants)
    const productsCount = await db.get('SELECT COUNT(*) as count FROM products');
    if (productsCount.count === 0) {
      // Get categories and brands
      const categories = await db.all('SELECT id, slug FROM categories WHERE parent_id IS NOT NULL LIMIT 2');
      const brandList = await db.all('SELECT id FROM brands LIMIT 2');

      if (categories.length > 0 && brandList.length > 0) {
        const categoryId = categories[0].id;
        const brandId = brandList[0].id;

        // Create sample product
        const productId = uuidv4();
        await db.run(
          `INSERT INTO products (id, name, slug, description, base_price, category_id, brand_id, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`,
          [productId, 'Áo thun cotton basic', 'ao-thun-cotton-basic', 'Áo thun chất liệu cotton 100%, thoáng mát', 299000, categoryId, brandId, 1]
        );

        // Create variants (size + color)
        const sizes = ['S', 'M', 'L', 'XL'];
        const colors = [
          { name: 'Đen', hex: '#000000' },
          { name: 'Trắng', hex: '#FFFFFF' },
          { name: 'Xám', hex: '#808080' }
        ];

        for (const size of sizes) {
          for (const color of colors) {
            const variantId = uuidv4();
            const sku = `ATCB-${size}-${color.name}`;
            await db.run(
              `INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, stock_quantity, low_stock_threshold, price_adjustment, is_available, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))`,
              [variantId, productId, sku, size, color.name, color.hex, 50, 5, 0, 1]
            );
          }
        }

        // Add product image
        const imageId = uuidv4();
        await db.run(
          'INSERT INTO product_images (id, product_id, url, is_primary, sort_order, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
          [imageId, productId, '/images/placeholder.jpg', 1, 0]
        );

        console.log('✅ Products seeded (1 product with 12 variants)');
      }
    }
  } catch (error) {
    console.error('❌ Product seeding failed:', error);
    throw error;
  }

  try {
    // 5. Seed coupon if empty
    const couponCount = await db.get('SELECT COUNT(*) as count FROM coupons');
    if (couponCount.count === 0) {
      const couponId = uuidv4();
      await db.run(
        `INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, usage_limit, used_count, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [couponId, 'TEST10', 'percentage', 10, 0, 100, 0, 1]
      );
      console.log('✅ Coupon seeded: TEST10 (10% off)');
    }
  } catch (error) {
    console.error('❌ Coupon seeding failed:', error);
    throw error;
  }

  console.log('🎉 Database seeding completed successfully!');
}

// Allow running directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seed failed:', err);
      process.exit(1);
    });
}
