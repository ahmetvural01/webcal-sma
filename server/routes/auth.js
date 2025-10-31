const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    // Get user from database
    const userResult = await db.query(
      'SELECT id, kullanici_adi, sifre_hash, rol FROM kullanicilar WHERE kullanici_adi = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.sifre_hash || '');
    if (!validPassword) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    // Get role information
    const roleResult = await db.query(
      'SELECT name, label, permissions FROM roles WHERE name = $1',
      [user.rol]
    );

    const role = roleResult.rows.length > 0 ? roleResult.rows[0] : null;
    const isRootAdmin = user.rol === 'root';

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.kullanici_adi, 
        rol: user.rol 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.kullanici_adi,
        rol: user.rol,
        isRootAdmin,
        role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
