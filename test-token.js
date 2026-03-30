const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testToken() {
  // Register new user
  const reg = await axios.post(`${API}/auth/register`, {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'test123',
    phone: '0901234567'
  });
  const token = reg.data.data.token;
  console.log('Token received:', token.slice(0, 20) + '...');

  // Set header
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // Try to access products (requires auth? products là public nên không cần token)
  // Try cart (requires auth)
  try {
    const cart = await axios.get(`${API}/cart`);
    console.log('Cart call succeeded:', cart.data);
  } catch (err) {
    console.error('Cart call failed:', err.response?.status, err.response?.data);
  }
}

testToken();
