const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve('data/fashion_shop.db');
const db = new sqlite3.Database(dbPath);

console.log('📂 Connecting to:', dbPath);

// Hash password
const password = 'admin123';
const saltRounds = 10;
const password_hash = bcrypt.hashSync(password, saltRounds);

const adminId = 'admin-uuid-001';

db.serialize(() => {
  // Create users table if not exists (should exist, but ensure)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    email_verified INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err.message);
      db.close();
      return;
    }
    console.log('✅ Users table ready');

    // Insert or update admin user
    const sql = `INSERT OR REPLACE INTO users (id, email, password_hash, full_name, phone, role, email_verified) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      adminId,
      'admin@example.com',
      password_hash,
      'Admin User',
      '0901234567',
      'admin',
      1
    ];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('❌ Error inserting admin:', err.message);
      } else {
        console.log(`✅ Admin user created/updated (changes: ${this.changes})`);
        console.log(`   Email: admin@example.com`);
        console.log(`   Password: admin123`);
        console.log(`   Role: admin`);
      }
      db.close();
    });
  });
});
