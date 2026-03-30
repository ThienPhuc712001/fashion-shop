const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testVariantDirect() {
  // Login admin
  const login = await axios.post(`${API}/auth/login`, {
    email: 'admin@example.com',
    password: 'admin123'
  });
  const token = login.data.data.token;
  console.log('Token:', token.slice(0, 20) + '...');

  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // Get product
  const products = await axios.get(`${API}/products?limit=1`);
  const productId = products.data.data.products[0].id;
  console.log('Product ID:', productId);

  // POST variant with stock_quantity and color
  try {
    const timestamp = Date.now();
    const res = await axios.post(`${API}/products/${productId}/variants`, {
      size: 'M',
      color: 'Đỏ',
      stock_quantity: 10,
      sku: `TEST-${timestamp}-RED-M`
    });
    console.log('✅ Variant created:');
    console.log(JSON.stringify(res.data.data, null, 2));
  } catch (err) {
    console.error('❌ Error:');
    console.error('Status:', err.response?.status);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
  }
}

testVariantDirect();
