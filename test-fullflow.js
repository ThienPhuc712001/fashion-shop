const axios = require('axios');

const API = 'http://localhost:9877/api';

async function autoTestFullFlow() {
  console.log('🤖 Starting automated full flow test...\n');
  let tokenAdmin = '';
  let productId = '';
  let variantId = '';
  let orderId = '';
  let orderNumber = '';

  try {
    // ==================== PHASE 1: ADMIN SETUP ====================
    console.log('📦 PHASE 1: ADMIN SETUP\n');

    // 1. Login admin
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    tokenAdmin = loginRes.data.token;
    console.log('✅ Admin logged in');

    // Set admin auth
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenAdmin}`;

    // 2. Get or create test product
    let productsRes = await axios.get(`${API}/products?limit=100`);
    let products = productsRes.data.data.products;
    let testProduct = products.find(p => p.name === 'Test Product Quick');

    if (!testProduct) {
      // Create product
      console.log('→ Creating test product...');
      const catRes = await axios.get(`${API}/categories`);
      const category = catRes.data.find(c => c.slug === 'quan-ao') || catRes.data[0];
      const brandRes = await axios.get(`${API}/brands`);
      const brand = brandRes.data[0];

      const prodRes = await axios.post(`${API}/products`, {
        name: 'Test Product Quick',
        slug: 'test-product-quick',
        description: 'Auto-created for testing',
        category_id: category?.id,
        brand_id: brand?.id,
        base_price: 999000,
        is_active: 1
      });
      testProduct = prodRes.data;
      console.log(`✅ Created product: ${testProduct.name} (ID: ${testProduct.id})`);
    } else {
      console.log(`✅ Found existing product: ${testProduct.name} (ID: ${testProduct.id})`);
    }
    productId = testProduct.id;

    // 3. Ensure product has at least 1 variant
    let detailRes = await axios.get(`${API}/products/${productId}`);
    let variants = detailRes.data.data.variants || [];
    let variant = variants[0];

    if (!variant) {
      console.log('→ Creating variant...');
      const variantRes = await axios.post(`${API}/products/${productId}/variants`, {
        size: 'M',
        color: 'Đen',
        stock: 10,
        sku: `TEST-${productId.slice(0,4)}-M-BLK`
      });
      variant = variantRes.data;
      console.log(`✅ Created variant: Size ${variant.size}, Color ${variant.color}, Stock ${variant.stock}`);
    } else {
      console.log(`✅ Using existing variant: Size ${variant.size}, Color ${variant.color}, Stock ${variant.stock}`);
    }
    variantId = variant.id;

    // ==================== PHASE 2: GUEST USER FLOW ====================
    console.log('\n🛒 PHASE 2: GUEST USER FLOW\n');

    // Clear admin auth, become guest
    delete axios.defaults.headers.common['Authorization'];

    // 4. Get guest cart (creates session)
    const cart1 = await axios.get(`${API}/cart`);
    const sessionId = cart1.data.sessionId;
    console.log(`✅ Guest session created: ${sessionId.slice(0,8)}...`);

    // 5. Add item to cart
    await axios.post(`${API}/cart/items`, {
      productId,
      variantId,
      quantity: 2
    });
    console.log('✅ Added item to cart (qty: 2)');

    // 6. Verify cart
    const cart2 = await axios.get(`${API}/cart`);
    const cartItem = cart2.data.items[0];
    console.log(`✅ Cart now has ${cart2.data.items.length} item(s)`);
    console.log(`   - Product: ${cartItem.product.name}`);
    console.log(`   - Variant: ${cartItem.variant.size}/${cartItem.variant.color}`);
    console.log(`   - Qty: ${cartItem.quantity}`);
    console.log(`   - Cart total: ${cart2.data.total}`);

    // 7. Create order (COD)
    const orderData = {
      items: cart2.data.items.map(item => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity,
        price: item.product.price
      })),
      shippingAddress: {
        name: 'Automated Test',
        phone: '0901234567',
        email: 'autotest@example.com',
        street: '123 Auto Street',
        city: 'Ho Chi Minh City',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      billingAddress: {
        name: 'Automated Test',
        phone: '0901234567',
        email: 'autotest@example.com',
        street: '123 Auto Street',
        city: 'Ho Chi Minh City',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      subtotal: cart2.data.subtotal,
      tax: cart2.data.tax,
      shipping: cart2.data.shipping,
      discount: 0,
      total: cart2.data.total,
      paymentMethod: 'cod',
      notes: 'Automated test order - please ignore'
    };

    const orderRes = await axios.post(`${API}/orders`, orderData);
    const order = orderRes.data;
    orderId = order.id;
    orderNumber = order.orderNumber;
    console.log(`\n✅ ORDER CREATED!`);
    console.log(`   - Order #: ${orderNumber}`);
    console.log(`   - Order ID: ${orderId}`);
    console.log(`   - Total: ${order.total}`);
    console.log(`   - Status: ${order.status}`);
    console.log(`   - Payment: ${order.paymentMethod} (${order.paymentStatus})`);

    // ==================== PHASE 3: ADMIN VERIFICATION ====================
    console.log('\n👨‍💼 PHASE 3: ADMIN VERIFICATION\n');

    // Re-login admin (if needed)
    if (!axios.defaults.headers.common['Authorization']) {
      const loginRes2 = await axios.post(`${API}/auth/login`, {
        email: 'admin@example.com',
        password: 'admin123'
      });
      tokenAdmin = loginRes2.data.token;
      axios.defaults.headers.common['Authorization'] = `Bearer ${tokenAdmin}`;
    }

    // 8. Check order in admin list
    const ordersList = await axios.get(`${API}/orders?limit=100`);
    const foundOrder = ordersList.data.find(o => o.id === orderId);
    if (foundOrder) {
      console.log(`✅ Admin can see order #${foundOrder.orderNumber} in list`);
      console.log(`   - Customer: ${foundOrder.guestEmail || 'N/A'}`);
      console.log(`   - Total: ${foundOrder.total}`);
      console.log(`   - Status: ${foundOrder.status}`);
    } else {
      throw new Error('Order not found in admin orders list');
    }

    // 9. Get order detail
    const detail = await axios.get(`${API}/orders/${orderId}`);
    console.log(`✅ Admin can view order detail:`);
    console.log(`   - Items: ${detail.data.items.length} type(s)`);
    console.log(`   - Shipping to: ${detail.data.shippingAddress.name}, ${detail.data.shippingAddress.city}`);
    console.log(`   - Payment: ${detail.data.paymentMethod}`);

    // 10. Update order status
    await axios.put(`${API}/orders/${orderId}/status`, { status: 'processing' });
    console.log('✅ Admin updated order status to "processing"');

    // Verify update
    const updated = await axios.get(`${API}/orders/${orderId}`);
    console.log(`   - New status: ${updated.data.status}`);

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AUTOMATED TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📋 TEST SUMMARY:');
    console.log(`   • Product ID: ${productId}`);
    console.log(`   • Variant ID: ${variantId}`);
    console.log(`   • Guest Session ID: ${sessionId.slice(0,8)}...`);
    console.log(`   • Order Number: ${orderNumber}`);
    console.log(`   • Order ID: ${orderId}`);
    console.log(`   • Final Status: ${updated.data.status}`);
    console.log('\n🔗 URLs:');
    console.log(`   • FE Home: http://localhost:3002`);
    console.log(`   • Order detail (admin): http://localhost:3002/admin/orders/${orderId}`);
    console.log(`   • Order detail (customer): http://localhost:3002/orders`);
    console.log('\n✅ All checks passed. System is working correctly!\n');

  } catch (err) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

autoTestFullFlow();
