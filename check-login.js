const axios = require('axios');
const API = 'http://localhost:9877/api';

async function checkAdminRole() {
  const login = await axios.post(`${API}/auth/login`, {
    email: 'admin@example.com',
    password: 'admin123'
  });
  console.log('Login response:', JSON.stringify(login.data, null, 2));
}

checkAdminRole();
