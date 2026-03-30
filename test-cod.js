const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testCOD() {
  try {
    console.log('🧪 Testing COD order (no payment)\n');

    // Get product+variant
    const prodRes = await axios.get(`${API}/products?limit=1`);
    const product = prodRes.data.data.products[0];
    console.log('📦 Product:', product.name);

    const detail = await axios.get(`${API}/products/${product.id}`);
    const variant = detail.data.data.variants[0];
    console.log('   Variant:', variant.size, '/', variant.color);

    // Guest cart
    const cartInit = await axios.get(`${API}/cart`);
    const sessionId = cartInit.data.data.cart_session;
    console.log('🛒 Session:', sessionId.slice(0,8));

    // Add to cart
    await axios.post(`${API}/cart/items`, {
      productId: product.id,
      variantId: variant.id,
      quantity: 1
    });

    const cart = await axios.get(`${API}/cart`);
    const items = cart.data.data.items;
    const totals = cart.data.data;
    console.log('   Cart total:', totals.total);

    // Create order with COD
    const orderPayload = {
      items: items.map(i => ({
        productId: i.product.id,
        variantId: i.variant.id,
        quantity: i.quantity,
        price: i.product.price
      })),
      shippingAddress: {
        name: 'Test COD',
        phone: '0901234567',
        email: 'cod@test.com',
        street: '123 Test',
        city: 'HCMC',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      billingAddress: {
        name: 'Test COD',
        phone: '0901234567',
        email: 'cod@test.com',
        street: '123 Test',
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
      notes: 'Test COD order'
    };

    const orderRes = await axios.post(`${API}/orders`, orderPayload);
    const order = orderRes.data;
    console.log('\n✅ Order created with COD');
    console.log('   Order #:', order.orderNumber);
    console.log('   Status:', order.status);
    console.log('   Payment URL (should be undefined):', order.payment_url);

  } catch (err) {
    console.error('\n❌ Error:');
    console.error('Status:', err.response?.status);
    console.error('Message:', err.response?.data?.message || err.response?.data || err.message);
  }
}

testCOD();
