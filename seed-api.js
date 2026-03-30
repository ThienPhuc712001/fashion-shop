const axios = require('axios');

const API = 'http://localhost:9877/api';

let authToken = '';

async function seed() {
  try {
    console.log('🌱 Starting seed via API...');

    // Try to register admin if not exists
    try {
      await axios.post(`${API}/auth/register`, {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        phone: '0901234567'
      });
      console.log('✓ Registered admin user');
    } catch (err) {
      if (err.response?.status === 409) console.log('→ Admin user already exists');
      else throw err;
    }

    // Login as admin
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = loginRes.data.token;
    console.log('✓ Logged in as admin');

    // Set default headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Seed Categories
    const categories = [
      { name: 'Quần áo', slug: 'quan-ao', description: 'Đồ trang phục' },
      { name: 'Giày dép', slug: 'giay-dep', description: 'Giày và dép' },
      { name: 'Phụ kiện', slug: 'phu-kien', description: 'Túi, ví, phụ kiện thời trang' }
    ];

    for (const cat of categories) {
      try {
        await axios.post(`${API}/categories`, cat);
        console.log(`✓ Created category: ${cat.name}`);
      } catch (err) {
        if (err.response?.status === 409) console.log(`→ Category exists: ${cat.name}`);
        else console.error(`Failed to create category ${cat.name}:`, err.message);
      }
    }

    // Seed Brands
    const brands = [
      { name: 'Nike', slug: 'nike', description: 'Just Do It' },
      { name: 'Adidas', slug: 'adidas', description: 'Impossible is Nothing' },
      { name: 'Zara', slug: 'zara', description: 'Thời trang đường phố' }
    ];

    for (const brand of brands) {
      try {
        await axios.post(`${API}/brands`, brand);
        console.log(`✓ Created brand: ${brand.name}`);
      } catch (err) {
        if (err.response?.status === 409) console.log(`→ Brand exists: ${brand.name}`);
        else console.error(`Failed to create brand ${brand.name}:`, err.message);
      }
    }

    // Fetch categories & brands to get IDs
    const catRes = await axios.get(`${API}/categories`);
    const brandRes = await axios.get(`${API}/brands`);

    const clothingCat = catRes.data.find(c => c.slug === 'quan-ao');
    const shoesCat = catRes.data.find(c => c.slug === 'giay-dep');
    const nikeBrand = brandRes.data.find(b => b.slug === 'nike');

    if (!clothingCat || !shoesCat || !nikeBrand) {
      throw new Error('Failed to get category/brand IDs');
    }

    // Seed Products
    const products = [
      {
        name: 'Áo khoác bomber',
        slug: 'ao-khoac-bomber',
        description: 'Áo khoác bomber polyester chất lượng cao, thiết kế thể thao.',
        price: 899000,
        compareAtPrice: 1299000,
        categoryId: clothingCat.id,
        brandId: nikeBrand.id,
        isActive: true,
        variants: [
          { size: 'M', color: 'Đen', sku: 'ABC-M-BLK', stock: 10 },
          { size: 'L', color: 'Đen', sku: 'ABC-L-BLK', stock: 8 },
          { size: 'M', color: 'Xám', sku: 'ABC-M-GRY', stock: 5 },
        ]
      },
      {
        name: 'Giày Nike Air',
        slug: 'giay-nike-air',
        description: 'Giày thể thao công nghệ Air, êm ái.',
        price: 2500000,
        categoryId: shoesCat.id,
        brandId: nikeBrand.id,
        isActive: true,
        variants: [
          { size: '42', color: 'Trắng', sku: 'NK-42-WHT', stock: 15 },
          { size: '43', color: 'Trắng', sku: 'NK-43-WHT', stock: 10 },
          { size: '42', color: 'Đen', sku: 'NK-42-BLK', stock: 7 },
        ]
      }
    ];

    for (const prod of products) {
      try {
        const { variants, ...productData } = prod;
        const res = await axios.post(`${API}/products`, productData);
        const product = res.data;

        // Add variants
        for (const variant of variants) {
          await axios.post(`${API}/products/${product.id}/variants`, variant);
        }

        console.log(`✓ Created product: ${product.name} with ${variants.length} variants`);
      } catch (err) {
        console.error(`Failed to create product ${prod.name}:`, err.response?.data?.message || err.message);
      }
    }

    console.log('✅ Seed completed!');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  }
}

seed();
