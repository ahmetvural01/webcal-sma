const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/db');
const { generateToken } = require('../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM kullanicilar WHERE kullanici_adi = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Support both sifre and sifre_hash columns for backward compatibility
    const passwordHash = user.sifre_hash || user.sifre;
    
    if (!passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, passwordHash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Get role information
    const roleResult = await pool.query(
      'SELECT * FROM roller WHERE name = $1',
      [user.rol]
    );

    const role = roleResult.rows.length > 0 ? roleResult.rows[0] : null;

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        username: user.kullanici_adi,
        rol: user.rol,
        isRootAdmin: user.rol === 'root',
        role: role,
        extra_permissions: user.extra_permissions || [],
        removed_permissions: user.removed_permissions || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
