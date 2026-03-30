const fetch = require('node-fetch');

(async () => {
  try {
    // Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@fashionshop.com', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error('Login failed: ' + loginData.error);
    const token = loginData.data.token;
    console.log('✅ Logged in. Token:', token.substring(0, 30) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    // Test endpoints
    const tests = [
      ['Dashboard', 'http://localhost:3000/api/admin/dashboard/stats'],
      ['Admin Orders', 'http://localhost:3000/api/admin/orders?page=1'],
      ['Admin Products', 'http://localhost:3000/api/admin/products?page=1'],
      ['Admin Customers', 'http://localhost:3000/api/admin/customers?page=1'],
      ['Admin Inventory', 'http://localhost:3000/api/admin/inventory?page=1']
    ];

    for (const [name, url] of tests) {
      try {
        const res = await fetch(url, { headers, method: 'GET' });
        const data = await res.json();
        if (data.success) {
          console.log(`✅ ${name}: SUCCESS`, data.data ? `(Count: ${data.data.length || data.data.Count})` : '');
        } else {
          console.log(`❌ ${name}: FAIL - ${data.error}`);
        }
      } catch (err) {
        console.log(`❌ ${name}: ERROR - ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (err) {
    console.error('FATAL:', err.message);
  }
})();
