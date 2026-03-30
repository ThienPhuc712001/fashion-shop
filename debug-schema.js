const db = require('./dist/config/database').default;

async function main() {
  try {
    await db.connect();
    
    console.log('=== product_variants ===');
    const pvCols = await db.all('PRAGMA table_info(product_variants)');
    pvCols.forEach(col => console.log(` - ${col.name} (${col.type})`));
    
    console.log('\n=== products ===');
    const pCols = await db.all('PRAGMA table_info(products)');
    pCols.forEach(col => console.log(` - ${col.name} (${col.type})`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
