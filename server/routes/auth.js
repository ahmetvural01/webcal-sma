const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/auth/login - authenticate user and return JWT
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Get user from database
    const result = await db.query(
      'SELECT id, kullanici_adi, sifre_hash, rol FROM kullanicilar WHERE kullanici_adi = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.sifre_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Get role information
    const roleResult = await db.query(
      'SELECT name, label, permissions FROM roles WHERE name = $1',
      [user.rol]
    );

    const role = roleResult.rows.length > 0 ? roleResult.rows[0] : null;
    const isRootAdmin = user.rol === 'root';

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.kullanici_adi, 
        rol: user.rol,
        isRootAdmin
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return token and user info
    res.json({
      token,
      user: {
        id: user.id,
        username: user.kullanici_adi,
        isRootAdmin,
        role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
