const axios = require('axios');
const API = 'http://localhost:9877/api';

async function checkProduct() {
  const res = await axios.get(`${API}/products?limit=1`);
  console.log('Full response:', JSON.stringify(res.data, null, 2));
}

checkProduct();
