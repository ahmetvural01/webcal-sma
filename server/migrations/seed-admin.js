/**
 * Seed script to create an initial admin user
 * Usage: node seed-admin.js <username> <password>
 * Example: node seed-admin.js admin MySecurePassword123
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedAdmin() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.error('Usage: node seed-admin.js <username> <password>');
    console.error('Example: node seed-admin.js admin MySecurePassword123');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT * FROM kullanicilar WHERE kullanici_adi = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      console.error(`User '${username}' already exists!`);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin user
    const result = await pool.query(
      'INSERT INTO kullanicilar (kullanici_adi, sifre_hash, sifre, rol, extra_permissions, removed_permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, kullanici_adi, rol',
      [username, hashedPassword, hashedPassword, 'root', [], []]
    );

    console.log('✓ Admin user created successfully!');
    console.log('  Username:', result.rows[0].kullanici_adi);
    console.log('  Role:', result.rows[0].rol);
    console.log('  ID:', result.rows[0].id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
}

seedAdmin();
