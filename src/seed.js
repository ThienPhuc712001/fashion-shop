import { v4 as uuidv4 } from 'uuid';
import db from './config/database.js';
import * as fs from 'fs';
import * as path from 'path';
const seed = async () => {
    try {
        console.log('🌱 Starting seed...');
        await db.init();
        // Seed Categories
        const categoriesData = [
            { name: 'Quần áo', slug: 'quan-ao', description: 'Đồ trang phục', sort_order: 1 },
            { name: 'Giày dép', slug: 'giay-dep', description: 'Giày và dép', sort_order: 2 },
            { name: 'Phụ kiện', slug: 'phu-kien', description: 'Túi, ví, phụ kiện thời trang', sort_order: 3 }
        ];
        for (const cat of categoriesData) {
            const existing = await db.get('SELECT id FROM categories WHERE slug = ?', [cat.slug]);
            if (!existing) {
                await db.run(`INSERT INTO categories (id, name, slug, description, sort_order, is_active) 
           VALUES (?, ?, ?, ?, ?, ?)`, [uuidv4(), cat.name, cat.slug, cat.description, cat.sort_order, true]);
                console.log(`  ✅ Category: ${cat.name}`);
            }
            else {
                console.log(`  ⏭️  Category exists: ${cat.name}`);
            }
        }
        // Get category IDs
        const clothingCat = await db.get('SELECT id FROM categories WHERE slug = ?', ['quan-ao']);
        const shoesCat = await db.get('SELECT id FROM categories WHERE slug = ?', ['giay-dep']);
        if (!clothingCat || !shoesCat)
            throw new Error('Failed to fetch category IDs');
        // Seed Brands
        const brandsData = [
            { name: 'Nike', slug: 'nike' },
            { name: 'Adidas', slug: 'adidas' },
            { name: 'Uniqlo', slug: 'uniqlo' },
            { name: 'Zara', slug: 'zara' },
            { name: 'Bashion Tek', slug: 'bashion' }
        ];
        for (const brand of brandsData) {
            const existing = await db.get('SELECT id FROM brands WHERE slug = ?', [brand.slug]);
            if (!existing) {
                await db.run(`INSERT INTO brands (id, name, slug, is_active) VALUES (?, ?, ?, ?)`, [uuidv4(), brand.name, brand.slug, true]);
                console.log(`  ✅ Brand: ${brand.name}`);
            }
            else {
                console.log(`  ⏭️  Brand exists: ${brand.name}`);
            }
        }
        // Get brand IDs
        const nikeBrand = await db.get('SELECT id FROM brands WHERE slug = ?', ['nike']);
        const adidasBrand = await db.get('SELECT id FROM brands WHERE slug = ?', ['adidas']);
        if (!nikeBrand || !adidasBrand)
            throw new Error('Failed to fetch brand IDs');
        // Seed Products
        const productsData = [
            {
                slug: 'ao-thun-nam-basic',
                name: 'Áo thun nam basic',
                description: 'Áo thun cotton 100%',
                category_id: clothingCat.id,
                brand_id: nikeBrand.id,
                base_price: 299000
            },
            {
                slug: 'quan-jeans-nam-slim-fit',
                name: 'Quần jeans nam slim fit',
                description: 'Quần jeans co giãn',
                category_id: clothingCat.id,
                brand_id: adidasBrand.id,
                base_price: 599000
            },
            {
                slug: 'giay-nike-air-max',
                name: 'Giày thể thao Nike Air Max',
                description: 'Giày chạy bộ công nghệ',
                category_id: shoesCat.id,
                brand_id: nikeBrand.id,
                base_price: 2499000
            }
        ];
        for (const prod of productsData) {
            // Check if product exists
            const existing = await db.get('SELECT id FROM products WHERE slug = ?', [prod.slug]);
            let productId;
            if (!existing) {
                productId = uuidv4();
                await db.run(`INSERT INTO products (id, name, slug, description, category_id, brand_id, base_price, is_active, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`, [productId, prod.name, prod.slug, prod.description, prod.category_id, prod.brand_id, prod.base_price, true]);
                console.log(`  ✅ Product: ${prod.name}`);
            }
            else {
                productId = existing.id;
                console.log(`  ⏭️  Product exists: ${prod.name}`);
            }
            // Check if product already has variants
            const variantCount = await db.get('SELECT COUNT(*) as count FROM product_variants WHERE product_id = ?', [productId]);
            if (variantCount.count > 0) {
                console.log(`  ⏭️  Variants exist for ${prod.name} (${variantCount.count} variants)`);
                continue;
            }
            // Add variants for each product (sizes and colors)
            const sizes = ['S', 'M', 'L', 'XL'];
            const colors = [
                { name: 'Đen', hex: '#000000' },
                { name: 'Trắng', hex: '#FFFFFF' },
                { name: 'Xanh navy', hex: '#000080' }
            ];
            for (const size of sizes) {
                for (const color of colors) {
                    const variantId = uuidv4();
                    const uniqueSuffix = uuidv4().substring(0, 8);
                    const sku = `${prod.slug}-${size}-${color.name}-${uniqueSuffix}`.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                    await db.run(`INSERT INTO product_variants (id, product_id, sku, size, color_name, color_hex, stock_quantity, is_available) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [variantId, productId, sku, size, color.name, color.hex, 50, true]);
                }
            }
            console.log(`    → Added ${sizes.length * colors.length} variants`);
            // Check if product already has primary image
            const imageCount = await db.get('SELECT COUNT(*) as count FROM product_images WHERE product_id = ?', [productId]);
            if (imageCount.count > 0) {
                console.log(`  ⏭️  Images exist for ${prod.name}`);
                continue;
            }
            // Add placeholder image (create a simple 1x1 pixel PNG)
            const uploadsDir = path.join(process.cwd(), 'uploads', 'products', productId);
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const imageId = uuidv4();
            const imageUrl = `https://via.placeholder.com/500?text=${encodeURIComponent(prod.name)}`;
            await db.run(`INSERT INTO product_images (id, product_id, url, alt_text, is_primary, sort_order) 
         VALUES (?, ?, ?, ?, ?, ?)`, [imageId, productId, imageUrl, prod.name, true, 0]);
            console.log(`  ✅ Image added for ${prod.name}`);
        }
        // Create admin user if not exists
        const existingAdmin = await db.get("SELECT id FROM users WHERE email = ?", ['admin@fashionshop.com']);
        if (!existingAdmin) {
            const bcrypt = await import('bcrypt');
            const adminPassword = await bcrypt.hash('admin123', 10);
            const adminId = uuidv4();
            await db.run(`INSERT INTO users (id, email, password_hash, full_name, role, email_verified) 
         VALUES (?, ?, ?, ?, ?, ?)`, [adminId, 'admin@fashionshop.com', adminPassword, 'Admin Fashion Shop', 'admin', true]);
            console.log('✅ Admin user created (admin@fashionshop.com / admin123)');
        }
        else {
            console.log('⏭️  Admin user already exists');
        }
        console.log('\n🎉 Seed completed successfully!');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
};
seed();
