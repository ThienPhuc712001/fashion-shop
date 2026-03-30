const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testRegister() {
  try {
    console.log('Testing POST /auth/register...\n');
    const body = {
      name: 'Admin User',
      email: 'admin2@example.com',
      password: 'admin123',
      phone: '0901234567'
    };
    console.log('Request body:', JSON.stringify(body, null, 2));
    const res = await axios.post(`${API}/auth/register`, body);
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('\nError:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Message:', err.message);
    }
  }
}

testRegister();
