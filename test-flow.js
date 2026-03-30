const axios = require('axios');

const API = 'http://localhost:9877/api';

async function testFlow() {
  try {
    console.log('🧪 Testing full order flow...\n');

    // 1. Login admin (để có thể tạo variant)
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    let token = loginRes.data.token;
    console.log('✅ Logged in as admin');

    // Set auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 2. Lấy product đầu tiên
    const productsRes = await axios.get(`${API}/products?limit=1`);
    const product = productsRes.data.data.products[0];
    console.log(`✅ Found product: ${product.name} (ID: ${product.id})`);

    // 3. Lấy variants của product
    const detailRes = await axios.get(`${API}/products/${product.id}`);
    const productDetail = detailRes.data.data;
    let variant = productDetail.variants?.[0];

    // 4. Nếu chưa có variant, tạo mới
    if (!variant) {
      console.log('→ Creating variant...');
      const variantRes = await axios.post(`${API}/products/${product.id}/variants`, {
        size: 'M',
        color: 'Đen',
        stock: 10,
        sku: `TEST-${product.id.slice(0,4)}-M-BLK`
      });
      variant = variantRes.data;
      console.log(`✅ Created variant: Size ${variant.size}, Color ${variant.color}, Stock ${variant.stock}`);
    } else {
      console.log(`✅ Using existing variant: Size ${variant.size}, Color ${variant.color}, Stock ${variant.stock}`);
    }

    // 5. Xóa token admin để test guest flow
    delete axios.defaults.headers.common['Authorization'];

    // 6. Lấy giỏ hàng guest (session)
    const cartRes = await axios.get(`${API}/cart`);
    const cart = cartRes.data;
    console.log(`✅ Guest cart session: ${cart.sessionId.slice(0,8)}...`);

    // 7. Thêm sản phẩm vào giỏ
    await axios.post(`${API}/cart/items`, {
      productId: product.id,
      variantId: variant.id,
      quantity: 2
    });
    console.log('✅ Added product to cart (qty: 2)');

    // 8. Lấy giỏ hàng updated
    const updatedCart = await axios.get(`${API}/cart`);
    console.log(`✅ Cart now has ${updatedCart.data.items.length} item(s), total: ${updatedCart.data.total}`);

    // 9. Tạo đơn hàng (COD)
    const orderData = {
      items: updatedCart.data.items.map(item => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity,
        price: item.product.price
      })),
      shippingAddress: {
        name: 'Test User',
        phone: '0901234567',
        email: 'test@example.com',
        street: '123 Test Street',
        city: 'Ho Chi Minh City',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      billingAddress: {
        name: 'Test User',
        phone: '0901234567',
        email: 'test@example.com',
        street: '123 Test Street',
        city: 'Ho Chi Minh City',
        state: 'HCM',
        country: 'Vietnam',
        zipCode: '70000'
      },
      subtotal: updatedCart.data.subtotal,
      tax: updatedCart.data.tax,
      shipping: updatedCart.data.shipping,
      discount: 0,
      total: updatedCart.data.total,
      paymentMethod: 'cod',
      notes: 'Test order via API'
    };

    const orderRes = await axios.post(`${API}/orders`, orderData);
    const order = orderRes.data;
    console.log(`✅ Order created! Order #${order.orderNumber}, Total: ${order.total}`);

    // 10. Kiểm tra orders list (cần login lại admin)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const ordersList = await axios.get(`${API}/orders?limit=10`);
    console.log(`✅ Admin: Total orders in system: ${ordersList.data.length}`);

    console.log('\n🎉 FLOW TEST SUCCESSFUL!');
    console.log('📝 Order Number:', order.orderNumber);
    console.log('🔗 View order at:', `http://localhost:3002/admin/orders/${order.id}`);
  } catch (err) {
    console.error('\n❌ TEST FAILED:');
    console.error(err.response?.data || err.message);
  }
}

testFlow();
