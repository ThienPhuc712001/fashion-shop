const axios = require('axios');
const API = 'http://localhost:9877/api';

// No auth, guest
axios.get(`${API}/cart`)
  .then(res => console.log('Cart response:', JSON.stringify(res.data, null, 2)))
  .catch(err => console.error('Error:', err.response?.status, err.response?.data));
