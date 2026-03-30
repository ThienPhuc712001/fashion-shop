const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Sử dụng absolute path đến database
const dbPath = path.join(__dirname, 'data', 'fashion-shop.db');
const db = new sqlite3.Database(dbPath);

console.log('📂 Connecting to database:', dbPath);

db.serialize(() => {
  // First, check if users table exists
  db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, tables) => {
    if (err) {
      console.error('❌ Error checking tables:', err.message);
      db.close();
      return;
    }

    if (tables.length === 0) {
      console.log('⚠️ Users table does not exist. Database may be empty.');
      db.close();
      return;
    }

    console.log('✅ Users table found');

    // Check current admin user
    db.all("SELECT id, email, role FROM users WHERE email = 'admin@example.com'", (err, rows) => {
      if (err) {
        console.error('❌ Error querying user:', err.message);
        db.close();
        return;
      }

      if (rows.length === 0) {
        console.log('⚠️ Admin user not found in database.');
        db.close();
        return;
      }

      console.log('Current user:', rows[0]);

      if (rows[0].role === 'admin') {
        console.log('✅ User already has admin role.');
      } else {
        // Update to admin
        db.run(
          "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'",
          function(err) {
            if (err) {
              console.error('❌ Error updating role:', err.message);
            } else {
              console.log(`✅ Updated user role to admin (changes: ${this.changes})`);
            }
            db.close();
          }
        );
      }
    });
  });
});
