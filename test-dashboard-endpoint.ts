import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3000' });

let adminToken = '';

async function testDashboard() {
  // Login admin
  const loginRes = await API.post('/api/auth/login', {
    email: 'admin@fashionshop.com',
    password: 'admin123'
  });
  adminToken = loginRes.data.data.token;
  API.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;

  console.log('🔐 Logged in as admin');

  // Get dashboard stats
  try {
    const res = await API.get('/api/admin/dashboard/stats');
    console.log('📊 Dashboard response:');
    console.log('Status:', res.status);
    console.log('Success:', res.data.success);
    if (res.data.success) {
      console.log('Overview:', res.data.data.overview);
      console.log('Orders by status:', res.data.data.ordersByStatus.length, 'items');
      console.log('Top products:', res.data.data.topProducts.length, 'items');
      console.log('✅ Dashboard works!');
    } else {
      console.log('Error:', res.data.error);
    }
  } catch (err: any) {
    console.error('❌ Dashboard failed:', err.response?.status, err.response?.data);
  }

  process.exit(0);
}

testDashboard().catch(console.error);
