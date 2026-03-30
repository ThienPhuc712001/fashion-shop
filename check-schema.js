import db from './src/config/database.js';

async function checkSchema() {
  try {
    const info = await db.all("PRAGMA table_info(product_variants)");
    console.log('Columns in product_variants:');
    info.forEach(col => console.log(`- ${col.name} (type: ${col.type})`));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkSchema();
