const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testVariantDirect() {
  // Login admin
  const login = await axios.post(`${API}/auth/login`, {
    email: 'admin@example.com',
    password: 'admin123'
  });
  const token = login.data.data.token;
  console.log('Token:', token);

  // Set default header
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // Get product
  const products = await axios.get(`${API}/products?limit=1`);
  const productId = products.data.data.products[0].id;
  console.log('Product ID:', productId);

  // POST variant
  try {
    const res = await axios.post(`${API}/products/${productId}/variants`, {
      size: 'M',
      color: 'Đỏ',
      stock: 5,
      sku: 'TEST-RED-M'
    });
    console.log('✅ Variant created:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('❌ Error creating variant:');
    console.error('Status:', err.response?.status);
    console.error('Headers:', err.response?.headers);
    console.error('Data:', JSON.stringify(err.response?.data, null, 2));
  }
}

testVariantDirect();
