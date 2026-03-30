const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testAuth() {
  try {
    console.log('🔐 Testing admin auth...\n');

    // Login
    const login = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('Login response:', login.data);
    const token = login.data.token;

    // Test token with products endpoint
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const products = await axios.get(`${API}/products?limit=1`);
    console.log('\n✅ Products fetched with token:', products.data.data.products.length, 'product(s)');

    // Try create variant (need product ID)
    const productId = products.data.data.products[0].id;
    console.log('Product ID:', productId);

    const variant = await axios.post(`${API}/products/${productId}/variants`, {
      size: 'M',
      color: 'Đen',
      stock: 10
    });
    console.log('✅ Variant created:', variant.data);

  } catch (err) {
    console.error('\n❌ Error:');
    console.error('Status:', err.response?.status);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
  }
}

testAuth();
