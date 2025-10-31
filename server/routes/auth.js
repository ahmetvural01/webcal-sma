const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Login endpoint
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Get user from database
    const userResult = await pool.query(
      'SELECT * FROM kullanicilar WHERE kullanici_adi = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = userResult.rows[0];

    // Verify password (support both sifre and sifre_hash columns)
    const passwordHash = user.sifre_hash || user.sifre;
    if (!passwordHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isValidPassword = await bcrypt.compare(password, passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Get role information
    const roleResult = await pool.query(
      'SELECT * FROM roller WHERE name = $1',
      [user.rol]
    );

    const role = roleResult.rows[0] || { name: user.rol, label: user.rol, permissions: [] };

    // Calculate effective permissions
    const permsFromRole = role.permissions || [];
    const extraPerms = user.extra_permissions || [];
    const removedPerms = user.removed_permissions || [];

    const effectivePermissions = Array.from(new Set([
      ...permsFromRole,
      ...extraPerms
    ])).filter(p => !removedPerms.includes(p));

    const isRootAdmin = user.rol === 'root';

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.kullanici_adi,
        rol: user.rol,
        isRootAdmin: isRootAdmin,
        permissions: isRootAdmin ? [] : effectivePermissions // Root has all permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.kullanici_adi,
        rol: user.rol,
        isRootAdmin: isRootAdmin,
        role: role,
        permissions: effectivePermissions
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data
    const userResult = await pool.query(
      'SELECT * FROM kullanicilar WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get role information
    const roleResult = await pool.query(
      'SELECT * FROM roller WHERE name = $1',
      [user.rol]
    );

    const role = roleResult.rows[0] || { name: user.rol, label: user.rol, permissions: [] };

    // Calculate effective permissions
    const permsFromRole = role.permissions || [];
    const extraPerms = user.extra_permissions || [];
    const removedPerms = user.removed_permissions || [];

    const effectivePermissions = Array.from(new Set([
      ...permsFromRole,
      ...extraPerms
    ])).filter(p => !removedPerms.includes(p));

    const isRootAdmin = user.rol === 'root';

    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.kullanici_adi,
        rol: user.rol,
        isRootAdmin: isRootAdmin,
        role: role,
        permissions: effectivePermissions
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', valid: false });
  }
});

module.exports = router;
