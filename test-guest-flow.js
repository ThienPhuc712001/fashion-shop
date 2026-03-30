const axios = require('axios');
const API = 'http://localhost:9877/api';

async function testGuestFlow() {
  try {
    console.log('🛒 Testing GUEST FLOW (no admin needed)\n');

    // 1. Lấy product có sẵn
    const productsRes = await axios.get(`${API}/products?limit=10`);
    const products = productsRes.data.data.products;
    if (products.length === 0) throw new Error('No products in database. Run seed first!');

    // Chọn product có ít nhất 1 variant
    let product = null;
    let variant = null;

    for (const p of products) {
      const detail = await axios.get(`${API}/products/${p.id}`);
      const vars = detail.data.data.variants || [];
      if (vars.length > 0) {
        product = detail.data.data;
        variant = vars[0];
        break;
      }
    }

    if (!product || !variant) {
      throw new Error('No product with variants found. Please create variant via admin panel first.');
    }

    console.log('✅ Selected product:', product.name);
    console.log('   Variant:', variant.size, '/', variant.color, '(stock:', variant.stock, ')');
    console.log('   Price:', product.base_price);

    // 2. Guest cart (tạo session)
    const cart1 = await axios.get(`${API}/cart`);
    console.log('\n✅ Guest session created:', cart1.data.sessionId.slice(0, 8) + '...');

    // 3. Thêm vào cart
    await axios.post(`${API}/cart/items`, {
      productId: product.id,
      variantId: variant.id,
      quantity: 1
    });
    console.log('✅ Added item to cart');

    // 4. Kiểm tra cart
    const cart2 = await axios.get(`${API}/cart`);
    const item = cart2.data.items[0];
    console.log(`   Cart total: ${cart2.data.total} (${cart2.data.items.length} item)`);
    console.log(`   Product: ${item.product.name}, Qty: ${item.quantity}`);

    // 5. Tạo order (COD)
    const orderData = {
      items: cart2.data.items.map(i => ({
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
      subtotal: cart2.data.subtotal,
      tax: cart2.data.tax,
      shipping: cart2.data.shipping,
      discount: 0,
      total: cart2.data.total,
      paymentMethod: 'cod',
      notes: 'Guest test order'
    };

    const orderRes = await axios.post(`${API}/orders`, orderData);
    const order = orderRes.data;
    console.log('\n✅ ORDER CREATED!');
    console.log(`   Order #${order.orderNumber}`);
    console.log(`   Total: ${order.total}`);
    console.log(`   Status: ${order.status}`);

    console.log('\n🎉 GUEST FLOW TEST PASSED!\n');
    console.log('You can now:');
    console.log(`  • View order in admin panel (login as admin) -> /admin/orders`);
    console.log(`  • Or check FE: http://localhost:3002/orders (after logging in as customer)`);

  } catch (err) {
    console.error('\n❌ TEST FAILED');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Message:', err.response.data.message || err.response.data);
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

testGuestFlow();
