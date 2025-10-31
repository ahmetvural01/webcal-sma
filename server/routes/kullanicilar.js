const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/kullanicilar - get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, kullanici_adi, rol, extra_permissions, removed_permissions FROM kullanicilar ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/kullanicilar - create new user
router.post('/', authenticateToken, async (req, res) => {
  const { kullanici_adi, sifre, rol, extra_permissions, removed_permissions } = req.body;

  if (!kullanici_adi || !sifre || !rol) {
    return res.status(400).json({ error: 'Username, password, and role required' });
  }

  try {
    // Hash password
    const sifre_hash = await bcrypt.hash(sifre, 10);

    const result = await db.query(
      `INSERT INTO kullanicilar (kullanici_adi, sifre_hash, rol, extra_permissions, removed_permissions) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`,
      [kullanici_adi, sifre_hash, rol, extra_permissions || [], removed_permissions || []]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/kullanicilar/:id - update user
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { sifre, rol, extra_permissions, removed_permissions } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Only hash and update password if provided
    if (sifre) {
      const sifre_hash = await bcrypt.hash(sifre, 10);
      updates.push(`sifre_hash = $${paramCount++}`);
      values.push(sifre_hash);
    }

    if (rol !== undefined) {
      updates.push(`rol = $${paramCount++}`);
      values.push(rol);
    }

    if (extra_permissions !== undefined) {
      updates.push(`extra_permissions = $${paramCount++}`);
      values.push(extra_permissions);
    }

    if (removed_permissions !== undefined) {
      updates.push(`removed_permissions = $${paramCount++}`);
      values.push(removed_permissions);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE kullanicilar SET ${updates.join(', ')} 
       WHERE id = $${paramCount} 
       RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/kullanicilar/:id - delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM kullanicilar WHERE id = $1 RETURNING id', [id]);
    
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
