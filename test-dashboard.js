import db from './src/config/database';
async function testDashboardQueries() {
    await db.init();
    try {
        console.log('Testing all dashboard queries...\n');
        const period = 'month';
        let dateFilter = '';
        if (period === 'month') {
            dateFilter = "AND o.created_at >= datetime('now', 'start of month')";
        }
        // 1. Overview
        console.log('1. Overview...');
        const overview = await db.all(`SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total), 0) as total_revenue,
        COUNT(DISTINCT o.user_id) as total_customers,
        COALESCE(SUM(o.discount_amount), 0) as total_discounts
       FROM orders o
       WHERE 1=1 ${dateFilter}`);
        console.log('   OK');
        // 2. Orders by status
        console.log('2. Orders by status...');
        const ordersByStatus = await db.all(`SELECT status, COUNT(*) as count 
       FROM orders o
       WHERE 1=1 ${dateFilter}
       GROUP BY status 
       ORDER BY count DESC`);
        console.log(`   OK (${ordersByStatus.length} statuses)`);
        // 3. Top products
        console.log('3. Top products...');
        const topProducts = await db.all(`SELECT p.id, p.name, p.slug,
        COUNT(oi.id) as quantity_sold,
        SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       JOIN orders o ON oi.order_id = o.id
       WHERE 1=1 ${dateFilter}
       GROUP BY p.id
       ORDER BY quantity_sold DESC
       LIMIT 10`);
        console.log(`   OK (${topProducts.length} products)`);
        // 4. Top categories
        console.log('4. Top categories...');
        const topCategories = await db.all(`SELECT c.id, c.name, c.slug,
        COUNT(oi.id) as quantity_sold,
        SUM(oi.subtotal) as total_revenue
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       JOIN orders o ON oi.order_id = o.id
       WHERE 1=1 ${dateFilter}
       GROUP BY c.id
       ORDER BY total_revenue DESC
       LIMIT 10`);
        console.log(`   OK (${topCategories.length} categories)`);
        // 5. Sales trend
        console.log('5. Sales trend...');
        const salesTrend = await db.all(`SELECT date(o.created_at) as date,
        COUNT(*) as orders,
        SUM(o.total) as revenue
       FROM orders o
       WHERE o.created_at >= datetime('now', '-30 days')
       GROUP BY date(o.created_at)
       ORDER BY date`);
        console.log(`   OK (${salesTrend.length} days)`);
        // 6. Recent orders
        console.log('6. Recent orders...');
        const recentOrders = await db.all(`SELECT o.id, o.order_number, o.status, o.total, o.created_at,
              u.email as user_email, u.full_name as user_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`);
        console.log(`   OK (${recentOrders.length} orders)`);
        // 7. Low stock
        console.log('7. Low stock...');
        const lowStock = await db.all(`SELECT p.id, p.name, p.slug,
        SUM(pv.stock_quantity) as total_stock
       FROM products p
       JOIN product_variants pv ON p.id = pv.product_id
       GROUP BY p.id
       HAVING total_stock < 20
       ORDER BY total_stock ASC
       LIMIT 10`);
        console.log(`   OK (${lowStock.length} low stock items)`);
        // 8. Product performance
        console.log('8. Product performance...');
        const performance = await db.all(`SELECT p.id, p.name, p.slug, p.base_price,
        COUNT(oi.id) as sold_quantity,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue,
        COUNT(DISTINCT o.id) as order_count
       FROM products p
       LEFT JOIN product_variants pv ON p.id = pv.product_id
       LEFT JOIN order_items oi ON pv.id = oi.variant_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
       GROUP BY p.id
       ORDER BY sold_quantity DESC
       LIMIT 10`);
        console.log(`   OK (${performance.length} products)`);
        // 9. Inventory status
        console.log('9. Inventory status...');
        const inventory = await db.all(`SELECT p.id, p.name, p.slug,
        pv.sku, pv.size, pv.color_name, pv.stock_quantity,
        pv.low_stock_threshold,
        CASE WHEN pv.stock_quantity <= pv.low_stock_threshold THEN 1 ELSE 0 END as is_low_stock
       FROM products p
       JOIN product_variants pv ON p.id = pv.product_id
       ORDER BY pv.stock_quantity ASC`);
        console.log(`   OK (${inventory.length} variants)`);
        console.log('\n✅ All dashboard queries passed!');
    }
    catch (err) {
        console.error('\n❌ Query failed:', err);
        process.exit(1);
    }
    process.exit(0);
}
testDashboardQueries().catch(console.error);
