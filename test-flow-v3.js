const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testFullFlow() {
  console.log('🧪 TESTING FULL ORDER FLOW (with unique SKU)\n');
  let productId = '';
  let variantId = '';
  let orderId = '';

  try {
    // PHASE 1: ADMIN - GET product & create variant if needed
    console.log('📦 PHASE 1: ADMIN PREP\n');

    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const adminToken = loginRes.data.data.token;
    console.log('✅ Admin logged in');

    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;

    // Get product
    const productsRes = await axios.get(`${API}/products?limit=100`);
    const product = productsRes.data.data.products.find(p => p.name === 'Test Product Quick') || productsRes.data.data.products[0];
    productId = product.id;
    console.log(`✅ Using product: ${product.name} (ID: ${productId})`);

    // Get or create variant
    let detailRes = await axios.get(`${API}/products/${productId}`);
    let variants = detailRes.data.data.variants || [];
    let variant = variants[0];

    if (!variant || variants.length === 0) {
      console.log('→ Creating variant...');
      const timestamp = Date.now();
      const variantRes = await axios.post(`${API}/products/${productId}/variants`, {
        size: 'M',
        color: 'Đen',
        stock_quantity: 10,
        sku: `TEST-${timestamp}-M-BLK`
      });
      variant = variantRes.data.data;
      console.log(`✅ Variant created: ${variant.size}/${variant.color}, stock ${variant.stock_quantity}`);
    } else {
      console.log(`✅ Using existing variant: ${variant.size}/${variant.color}`);
    }
    variantId = variant.id;

    // PHASE 2: GUEST FLOW
    console.log('\n🛒 PHASE 2: GUEST CHECKOUT\n');

    delete axios.defaults.headers.common['Authorization'];

    // Get guest cart
    const cartInit = await axios.get(`${API}/cart`);
    const cartData = cartInit.data.data;
    if (!cartData || !cartData.cart_session) {
      throw new Error('Failed to get guest session');
    }
    const sessionId = cartData.cart_session;
    console.log(`✅ Guest session: ${sessionId.slice(0,8)}...`);

    // Add to cart
    await axios.post(`${API}/cart/items`, {
      productId,
      variantId,
      quantity: 2
    });
    console.log('✅ Added to cart (qty:2)');

    // Get cart
    const cart = await axios.get(`${API}/cart`);
    const cartItems = cart.data.data.items;
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart is empty after adding item');
    }
    console.log(`✅ Cart has ${cartItems.length} item(s), total: ${cart.data.data.total}`);

    // Create order
    const orderPayload = {
      items: cartItems.map(i => ({
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
      subtotal: cart.data.data.subtotal,
      tax: cart.data.data.tax,
      shipping: cart.data.data.shipping,
      discount: 0,
      total: cart.data.data.total,
      paymentMethod: 'cod',
      notes: 'Auto test order'
    };

    const orderRes = await axios.post(`${API}/orders`, orderPayload);
    const order = orderRes.data;
    orderId = order.id;
    console.log(`✅ Order created: #${order.orderNumber}, total ${order.total}`);

    // PHASE 3: ADMIN CHECK
    console.log('\n👨‍💼 PHASE 3: ADMIN VERIFY\n');

    const loginRes2 = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    axios.defaults.headers.common['Authorization'] = `Bearer ${loginRes2.data.data.token}`;

    const ordersList = await axios.get(`${API}/orders?limit=100`);
    const found = ordersList.data.find(o => o.id === orderId);
    console.log(`✅ Order in admin list: ${found ? 'YES' : 'NO'}`);

    if (found) {
      console.log(`   #${found.orderNumber}, status: ${found.status}`);
    }

    // Get detail
    const orderDetail = await axios.get(`${API}/orders/${orderId}`);
    console.log(`✅ Order detail: ${orderDetail.data.items.length} item(s)`);

    // Update status
    await axios.put(`${API}/orders/${orderId}/status`, { status: 'processing' });
    console.log('✅ Status updated to processing');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 FULL FLOW TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n🔗 Links:');
    console.log(`   FE: http://localhost:3002`);
    console.log(`   Admin orders: http://localhost:3002/admin/orders`);
    console.log(`   Order detail: http://localhost:3002/admin/orders/${orderId}`);
    console.log('\n');

  } catch (err) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Message:', err.response.data.message || JSON.stringify(err.response.data));
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

testFullFlow();
