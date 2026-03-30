const axios = require('axios');
const API = 'http://localhost:9877/api';

async function seedSimple() {
  try {
    console.log('🌱 Simple seed (categories, brands, products)\n');

    // Login lấy token (dùng user admin đã có, dù role 'customer' – nhưng vẫn cần token để gọi các endpoint public? Không cần token cho categories/brands)
    // Categories & Brands có thể public không auth. Thử không cần token.

    // 1. Categories
    const categories = [
      { name: 'Quần áo', slug: 'quan-ao', description: 'Đồ trang phục' },
      { name: 'Giày dép', slug: 'giay-dep', description: 'Giày và dép' },
      { name: 'Phụ kiện', slug: 'phu-kien', description: 'Túi, ví, phụ kiện' }
    ];

    for (const cat of categories) {
      try {
        await axios.post(`${API}/categories`, cat);
        console.log(`✓ Category: ${cat.name}`);
      } catch (err) {
        if (err.response?.status === 409) console.log(`→ Category exists: ${cat.name}`);
        else console.error(`Failed category ${cat.name}:`, err.response?.data?.message);
      }
    }

    // 2. Brands
    const brands = [
      { name: 'Nike', slug: 'nike', description: 'Just Do It' },
      { name: 'Adidas', slug: 'adidas', description: 'Impossible is Nothing' },
      { name: 'Zara', slug: 'zara', description: 'Thời trang đường phố' }
    ];

    for (const brand of brands) {
      try {
        await axios.post(`${API}/brands`, brand);
        console.log(`✓ Brand: ${brand.name}`);
      } catch (err) {
        if (err.response?.status === 409) console.log(`→ Brand exists: ${brand.name}`);
        else console.error(`Failed brand ${brand.name}:`, err.response?.data?.message);
      }
    }

    // Lấy IDs
    const catRes = await axios.get(`${API}/categories`);
    const brandRes = await axios.get(`${API}/brands`);
    const clothingCat = catRes.data.find(c => c.slug === 'quan-ao');
    const nikeBrand = brandRes.data.find(b => b.slug === 'nike');

    if (!clothingCat || !nikeBrand) {
      throw new Error('Cannot find category or brand');
    }

    // 3. Products (chỉ tạo nếu chưa có)
    const products = [
      {
        name: 'Áo thun nam basic',
        slug: 'ao-thun-nam-basic',
        description: 'Áo thun cotton 100%',
        category_id: clothingCat.id,
        brand_id: nikeBrand.id,
        base_price: 299000,
        is_active: 1,
        variants: [
          { size: 'S', color: 'Đen', stock: 10, sku: 'ATNB-S-BLK' },
          { size: 'M', color: 'Đen', stock: 15, sku: 'ATNB-M-BLK' },
          { size: 'L', color: 'Trắng', stock: 20, sku: 'ATNB-L-WHT' },
        ]
      }
    ];

    for (const p of products) {
      try {
        const { variants, ...productData } = p;
        const res = await axios.post(`${API}/products`, productData);
        const product = res.data;
        console.log(`✓ Product: ${product.name}`);

        // Tạo variants
        for (const v of variants) {
          await axios.post(`${API}/products/${product.id}/variants`, v);
          console.log(`   → Variant: ${v.size}/${v.color} (stock ${v.stock})`);
        }
      } catch (err) {
        if (err.response?.status === 409) {
          console.log(`→ Product exists: ${p.name}`);
        } else {
          console.error(`Failed product ${p.name}:`, err.response?.data?.message || err.message);
        }
      }
    }

    console.log('\n✅ Seed completed!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
  }
}

seedSimple();
