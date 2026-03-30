import db from './src/config/database';

async function check() {
  await db.init();
  const info = await db.all("PRAGMA table_info(orders)");
  console.log('Orders table columns:');
  info.forEach(col => console.log(` - ${col.name} (type: ${col.type})`));
  process.exit(0);
}
check().catch(console.error);
