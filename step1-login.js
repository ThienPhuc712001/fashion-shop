const axios = require('axios');
const API = 'http://localhost:9877/api';

async function step1() {
  try {
    const res = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    console.log('✅ Login admin成功, token:', res.data.data.token?.slice(0,20));
    return res.data.data.token;
  } catch (err) {
    console.error('❌ Login failed:', err.response?.data || err.message);
    throw err;
  }
}

step1();
