import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:3000' });
let adminToken = '';
async function testDashboard() {
    var _a, _b;
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
        }
        else {
            console.log('Error:', res.data.error);
        }
    }
    catch (err) {
        console.error('❌ Dashboard failed:', (_a = err.response) === null || _a === void 0 ? void 0 : _a.status, (_b = err.response) === null || _b === void 0 ? void 0 : _b.data);
    }
    process.exit(0);
}
testDashboard().catch(console.error);
