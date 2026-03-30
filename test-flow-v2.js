const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testFullFlow() {
  console.log('🧪 TESTING FULL ORDER FLOW (auto variant creation if needed)\n');

  try {
    // PHASE 1: Chuẩn bị data (admin)
    console.log('📦 PHASE 1: PREPARE PRODUCT WITH VARIANT\n');

    // Login admin to get token
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const adminToken = loginRes.data.token;
    console.log('✅ Admin logged in, token obtained');

    // Set auth header for subsequent admin calls
    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;

    // Find product to use (prefer "Test Product Quick", else create one)
    const productsRes = await axios.get(`${API}/products?limit=100`);
    const allProducts = productsRes.data.data.products;
    let product = allProducts.find(p => p.name === 'Test Product Quick');

    if (!product) {
      // Create a simple product
      const catRes = await axios.get(`${API}/categories`);
      const cat = catRes.data.find(c => c.slug === 'quan-ao') || catRes.data[0];
      const brandRes = await axios.get(`${API}/brands`);
      const brand = brandRes.data[0];

      const createProd = await axios.post(`${API}/products`, {
        name: 'Test Product Quick',
        slug: 'test-product-quick',
        description: 'Auto-created for testing',
        category_id: cat.id,
        brand_id: brand.id,
        base_price: 299000,
        is_active: 1
      });
      product = createProd.data;
      console.log(`✅ Created product: ${product.name} (ID: ${product.id})`);
    } else {
      console.log(`✅ Found product: ${product.name} (ID: ${product.id})`);
    }

    // Ensure product has variant
    let productDetail = await axios.get(`${API}/products/${product.id}`);
    let variants = productDetail.data.data.variants || [];
    let variant = variants[0];

    if (!variant || variants.length === 0) {
      console.log('→ Creating variant for product...');
      const variantRes = await axios.post(`${API}/products/${product.id}/variants`, {
        size: 'M',
        color: 'Đen',
        stock: 10,
        sku: `TEST-${product.id.slice(0,4)}-M-BLK`
      });
      variant = variantRes.data;
      console.log(`✅ Variant created: Size ${variant.size}, Color ${variant.color}, Stock ${variant.stock}`);
    } else {
      console.log(`✅ Using existing variant: Size ${variant.size}, Color ${variant.color}, Stock ${variant.stock}`);
    }
    const productId = product.id;
    const variantId = variant.id;

    // PHASE 2: Guest checku flow
    console.log('\n🛒 PHASE 2: GUEST CHECKOUT FLOW\n');

    // Remove admin auth to simulate guest
    delete axios.defaults.headers.common['Authorization'];

    // Get guest cart
    const cartInit = await axios.get(`${API}/cart`);
    const sessionId = cartInit.data.sessionId;
    console.log(`✅ Guest session: ${sessionId.slice(0,8)}...`);

    // Add item to cart
    await axios.post(`${API}/cart/items`, {
      productId,
      variantId,
      quantity: 2
    });
    console.log('✅ Added product to cart (qty: 2)');

    // Verify cart
    const cart = await axios.get(`${API}/cart`);
    console.log(`✅ Cart items: ${cart.data.items.length}`);
    console.log(`   Product: ${cart.data.items[0].product.name}`);
    console.log(`   Total: ${cart.data.total}`);

    // Create order (COD)
    const orderPayload = {
      items: cart.data.items.map(i => ({
        productId: i.product.id,
        variantId: i.variant.id,
        quantity: i.quantity,
        price: i.product.price
      })),
      shippingAddress: {
        name: 'Guest User',
        phone: '0901234567',
        email: 'guest@test.com',
        street: '123 Test Street',
        city: 'Ho Chi Minh City',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      billingAddress: {
        name: 'Guest User',
        phone: '0901234567',
        email: 'guest@test.com',
        street: '123 Test Street',
        city: 'Ho Chi Minh City',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      subtotal: cart.data.subtotal,
      tax: cart.data.tax,
      shipping: cart.data.shipping,
      discount: 0,
      total: cart.data.total,
      paymentMethod: 'cod',
      notes: 'Automated test order'
    };

    const orderRes = await axios.post(`${API}/orders`, orderPayload);
    const order = orderRes.data;
    console.log(`\n✅ ORDER PLACED!`);
    console.log(`   Order #: ${order.orderNumber}`);
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Total: ${order.total}`);

    // PHASE 3: Admin view
    console.log('\n👨‍💼 PHASE 3: ADMIN VIEW\n');

    // Re-login admin
    const loginRes2 = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const adminToken2 = loginRes2.data.token;
    axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken2}`;

    // Get orders list
    const ordersList = await axios.get(`${API}/orders?limit=100`);
    const found = ordersList.data.find(o => o.id === order.id);
    console.log(`✅ Order found in admin list? ${found ? 'YES' : 'NO'}`);

    if (found) {
      console.log(`   Order #${found.orderNumber}, Status: ${found.status}, Total: ${found.total}`);
    }

    // Get order detail
    const orderDetail = await axios.get(`${API}/orders/${order.id}`);
    console.log(`✅ Order detail retrieved: ${orderDetail.data.items.length} item(s)`);

    // Update status
    await axios.put(`${API}/orders/${order.id}/status`, { status: 'processing' });
    console.log('✅ Order status updated to "processing"');

    console.log('\n' + '='.repeat(60));
    console.log('🎉 FULL FLOW TEST PASSED!');
    console.log('='.repeat(60));
    console.log('\n🔗 QUICK LINKS:');
    console.log(`   FE Home:        http://localhost:3002`);
    console.log(`   Order in admin: http://localhost:3002/admin/orders`);
    console.log(`   Order detail:   http://localhost:3002/admin/orders/${order.id}`);
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
