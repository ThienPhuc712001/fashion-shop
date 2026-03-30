import db from './src/config/database';

async function test() {
  await db.init();
  const dateFilter = "AND o.created_at >= datetime('now', 'start of month')";
  try {
    const res = await db.all(
      `SELECT status, COUNT(*) as count 
       FROM orders 
       WHERE 1=1 ${dateFilter}
       GROUP BY status 
       ORDER BY count DESC`
    );
    console.log('Orders by status OK:', res);
  } catch (err: any) {
    console.error('Error:', err.message);
    // Print full query to see
    console.log('Query:', `SELECT status, COUNT(*) as count FROM orders WHERE 1=1 ${dateFilter} GROUP BY status ORDER BY count DESC`);
  }
  process.exit(0);
}
test();
