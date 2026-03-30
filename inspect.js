const axios = require('axios');
const API = 'http://localhost:9877/api';

async function inspect() {
  const res = await axios.get(`${API}/products?limit=1`);
  const productId = res.data.data.products[0].id;
  const detail = await axios.get(`${API}/products/${productId}`);
  console.log('Product detail:', JSON.stringify(detail.data.data, null, 2));
}

inspect();
