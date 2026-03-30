const axios = require('axios');
const API = 'http://localhost:9877/api';

async function runFullTest() {
  try {
    console.log('🚀 STARTING FULL ORDER FLOW TEST\n');

    // ============ PHASE 1: ADMIN ============
    console.log('📦 PHASE 1: ADMIN PREP\n');

    // Login admin
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const adminToken = loginRes.data.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    console.log('✅ Admin logged in');

    // Get a product (first)
    const productsRes = await axios.get(`${API}/products?limit=1`);
    const product = productsRes.data.data.products[0];
    console.log(`✅ Product: ${product.name} (ID: ${product.id})`);

    // Ensure variant exists
    let detailRes = await axios.get(`${API}/products/${product.id}`);
    let variants = detailRes.data.data.variants || [];
    let variant;

    if (variants.length === 0) {
      console.log('   → Creating variant...');
      const ts = Date.now();
      const variantRes = await axios.post(`${API}/products/${product.id}/variants`, {
        size: 'M',
        color: 'Đen',
        stock_quantity: 10,
        sku: `TEST-${ts}-M-BLK`
      });
      variant = variantRes.data.data;
      console.log(`✅ Variant: ${variant.size}/${variant.color}, stock ${variant.stock_quantity}`);
    } else {
      variant = variants[0];
      console.log(`✅ Variant exists: ${variant.size}/${variant.color}`);
    }
    const productId = product.id;
    const variantId = variant.id;

    // ============ PHASE 2: GUEST ============
    console.log('\n🛒 PHASE 2: GUEST CHECKOUT\n');

    // Clear auth
    delete axios.defaults.headers.common['Authorization'];

    // Get guest cart
    const cartInit = await axios.get(`${API}/cart`);
    const cartData = cartInit.data.data;
    console.log(`✅ Guest session: ${cartData.cart_session?.slice(0,8)}...`);

    // Add item
    await axios.post(`${API}/cart/items`, {
      productId,
      variantId,
      quantity: 2
    });
    console.log('✅ Added to cart (qty:2)');

    // Get cart again
    const cart = await axios.get(`${API}/cart`);
    const items = cart.data.data.items;
    const totals = cart.data.data;
    console.log(`✅ Cart: ${items.length} item(s), total ${totals.total}`);

    // Create order
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
      notes: 'Auto test order'
    };

    const orderRes = await axios.post(`${API}/orders`, orderPayload);
    const order = orderRes.data;
    console.log(`✅ Order created: #${order.orderNumber}, total ${order.total}`);

    // ============ PHASE 3: ADMIN VERIFY ============
    console.log('\n👨‍💼 PHASE 3: ADMIN VERIFY\n');

    // Re-login admin
    const loginRes2 = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    axios.defaults.headers.common['Authorization'] = `Bearer ${loginRes2.data.data.token}`;

    // Check orders list
    const ordersList = await axios.get(`${API}/orders?limit=100`);
    const found = ordersList.data.find(o => o.id === order.id);
    console.log(`✅ Order in admin list: ${found ? 'YES' : 'NO'}`);
    if (found) {
      console.log(`   #${found.orderNumber}, status: ${found.status}, total: ${found.total}`);
    }

    // Get detail
    const orderDetail = await axios.get(`${API}/orders/${order.id}`);
    console.log(`✅ Order detail: ${orderDetail.data.items.length} item(s)`);

    // Update status
    await axios.put(`${API}/orders/${order.id}/status`, { status: 'processing' });
    console.log('✅ Status updated to "processing"');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 FULL FLOW TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n🔗 URLs:');
    console.log(`   FE: http://localhost:3002`);
    console.log(`   Admin orders: http://localhost:3002/admin/orders`);
    console.log(`   Order detail: http://localhost:3002/admin/orders/${order.id}`);
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

runFullTest();
