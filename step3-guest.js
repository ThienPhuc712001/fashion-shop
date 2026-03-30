const axios = require('axios');
const API = 'http://localhost:9877/api';

async function step3(productId, variantId) {
  try {
    // Guest: không có auth header
    delete axios.defaults.headers.common['Authorization'];

    console.log('🛒 Guest getting cart...');
    const cartInit = await axios.get(`${API}/cart`);
    const cartData = cartInit.data.data;
    console.log('   Session:', cartData.cart_session?.slice(0,8) + '...');

    console.log('➕ Adding item to cart...');
    await axios.post(`${API}/cart/items`, {
      productId,
      variantId,
      quantity: 2
    });

    console.log('📋 Getting updated cart...');
    const cart = await axios.get(`${API}/cart`);
    const items = cart.data.data.items;
    const totals = cart.data.data;
    console.log(`   Items: ${items.length}, Total: ${totals.total}`);

    console.log('🧾 Creating order (COD)...');
    const orderPayload = {
      items: items.map(i => ({
        productId: i.product.id,
        variantId: i.variant.id,
        quantity: i.quantity,
        price: i.product.price
      })),
      shippingAddress: {
        name: 'Guest Tester',
        phone: '0901234567',
        email: 'guest@test.com',
        street: '123 Test Rd',
        city: 'HCMC',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      billingAddress: {
        name: 'Guest Tester',
        phone: '0901234567',
        email: 'guest@test.com',
        street: '123 Test Rd',
        city: 'HCMC',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      subtotal: totals.subtotal,
      tax: totals.tax,
      shipping: totals.shipping,
      discount: 0,
      total: totals.total,
      paymentMethod: 'cod',
      notes: 'Manual test order'
    };

    const orderRes = await axios.post(`${API}/orders`, orderPayload);
    const order = orderRes.data;
    console.log('✅ Order created!');
    console.log('   Order #:', order.orderNumber);
    console.log('   Order ID:', order.id);
    console.log('   Total:', order.total);
    console.log('   Status:', order.status);

    return order.id;
  } catch (err) {
    console.error('❌ Error in guest flow:');
    console.error('   Status:', err.response?.status);
    console.error('   Message:', err.response?.data?.message || err.message);
    throw err;
  }
}

// Lấy productId và variantId từ step2 (tôi sẽ hardcode từ kết quả trước)
// Thực tế nên chạy step2 trước, nhưng ở đây tôi dùng giá trị cũ
// Từ step2: productId = '...'; variantId = '...'
// Để đơn giản, tôi chạy step2 bên trong step3, nhưng hiện tại tôi sẽ copy từ output cũ

// Trong thực tế:
step2().then(res => step3(res.productId, res.variantId));
