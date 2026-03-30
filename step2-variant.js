const axios = require('axios');
const API = 'http://localhost:9877/api';

async function step2() {
  // Sử dụng token từ step1 (hardcode cho đơn giản)
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLXVzZXItdWlkK...'; // sẽ lấy từ output step1
  // Thực tế cần lưu token từ step1, nhưng ở đây tôi sẽ chạy lại login

  try {
    // Login
    const login = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = login.data.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Lấy product đầu tiên
    const productsRes = await axios.get(`${API}/products?limit=1`);
    const product = productsRes.data.data.products[0];
    console.log('📦 Product:', product.name, '| ID:', product.id);

    // Kiểm tra variants
    const detailRes = await axios.get(`${API}/products/${product.id}`);
    const variants = detailRes.data.data.variants || [];
    console.log('   Variants hiện tại:', variants.length);

    let variant;
    if (variants.length === 0) {
      console.log('   → Tạo variant mới...');
      const timestamp = Date.now();
      const variantRes = await axios.post(`${API}/products/${product.id}/variants`, {
        size: 'M',
        color: 'Đen',
        stock_quantity: 10,
        sku: `TEST-${timestamp}-M-BLK`
      });
      variant = variantRes.data.data;
      console.log('✅ Variant tạo:', variant.size, '/', variant.color, '| stock:', variant.stock_quantity);
    } else {
      variant = variants[0];
      console.log('✅ Dùng variant có sẵn:', variant.size, '/', variant.color);
    }

    return { productId: product.id, variantId: variant.id };
  } catch (err) {
    console.error('❌ Error:', err.response?.status, err.response?.data?.message);
    throw err;
  }
}

step2().then(res => {
  console.log('\n🎯 RESULT:', res);
}).catch(err => {
  console.error('Failed:', err.message);
});
