const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, kullanici_adi, rol, extra_permissions, removed_permissions, created_at FROM kullanicilar ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, kullanici_adi, rol, extra_permissions, removed_permissions, created_at FROM kullanicilar WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { kullanici_adi, sifre, rol, extra_permissions, removed_permissions } = req.body;

    if (!kullanici_adi || !sifre || !rol) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(sifre, 10);

    const result = await pool.query(
      'INSERT INTO kullanicilar (kullanici_adi, sifre_hash, sifre, rol, extra_permissions, removed_permissions) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions, created_at',
      [kullanici_adi, hashedPassword, hashedPassword, rol, extra_permissions || [], removed_permissions || []]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Username already exists' });
    } else if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid role' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rol, extra_permissions, removed_permissions, sifre } = req.body;

    let query = 'UPDATE kullanicilar SET rol = $1, extra_permissions = $2, removed_permissions = $3';
    let params = [rol, extra_permissions || [], removed_permissions || []];
    let paramIndex = 4;

    // Only update password if provided
    if (sifre && sifre.trim()) {
      const hashedPassword = await bcrypt.hash(sifre, 10);
      query += `, sifre_hash = $${paramIndex}, sifre = $${paramIndex}`;
      params.push(hashedPassword);
      paramIndex++;
    }

    query += ` WHERE id = $${paramIndex} RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid role' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM kullanicilar WHERE id = $1 RETURNING kullanici_adi', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
