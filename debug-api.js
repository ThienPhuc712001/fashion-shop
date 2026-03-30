const axios = require('axios');
const API = 'http://localhost:9877/api';

async function debug() {
  try {
    // Test categories endpoint
    console.log('Testing GET /categories...');
    const res = await axios.get(`${API}/categories`);
    console.log('Status:', res.status);
    console.log('Data:', JSON.stringify(res.data, null, 2));

    // Test POST category
    console.log('\nTesting POST /categories...');
    const postRes = await axios.post(`${API}/categories`, {
      name: 'Test Cat',
      slug: 'test-cat',
      description: 'Test'
    });
    console.log('Post status:', postRes.status);
    console.log('Post data:', JSON.stringify(postRes.data, null, 2));
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

debug();
