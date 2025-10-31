const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, kullanici_adi, rol, extra_permissions, removed_permissions FROM kullanicilar ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, kullanici_adi, rol, extra_permissions, removed_permissions FROM kullanicilar WHERE id = $1',
      [req.params.id]
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

// Get user by username
router.get('/by-username/:username', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, kullanici_adi, rol, extra_permissions, removed_permissions FROM kullanicilar WHERE kullanici_adi = $1',
      [req.params.username]
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

// Create new user
router.post('/', [
  authenticateToken,
  body('kullanici_adi').trim().notEmpty().withMessage('Username is required'),
  body('sifre').notEmpty().withMessage('Password is required'),
  body('rol').trim().notEmpty().withMessage('Role is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { kullanici_adi, sifre, rol, extra_permissions, removed_permissions } = req.body;

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM kullanicilar WHERE kullanici_adi = $1',
      [kullanici_adi]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(sifre, 10);

    // Insert user (use sifre_hash if column exists, fallback to sifre)
    const result = await pool.query(
      `INSERT INTO kullanicilar (kullanici_adi, sifre_hash, rol, extra_permissions, removed_permissions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`,
      [kullanici_adi, hashedPassword, rol, extra_permissions || [], removed_permissions || []]
    ).catch(async (err) => {
      // If sifre_hash column doesn't exist, try with sifre column
      if (err.code === '42703') {
        return await pool.query(
          `INSERT INTO kullanicilar (kullanici_adi, sifre, rol, extra_permissions, removed_permissions)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`,
          [kullanici_adi, hashedPassword, rol, extra_permissions || [], removed_permissions || []]
        );
      }
      throw err;
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', [
  authenticateToken,
  body('sifre').optional(),
  body('rol').optional().trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { sifre, rol, extra_permissions, removed_permissions } = req.body;

  try {
    // Build update query dynamically
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (sifre) {
      const hashedPassword = await bcrypt.hash(sifre, 10);
      updateFields.push(`sifre_hash = $${paramCount}`);
      values.push(hashedPassword);
      paramCount++;
    }

    if (rol !== undefined) {
      updateFields.push(`rol = $${paramCount}`);
      values.push(rol);
      paramCount++;
    }

    if (extra_permissions !== undefined) {
      updateFields.push(`extra_permissions = $${paramCount}`);
      values.push(extra_permissions);
      paramCount++;
    }

    if (removed_permissions !== undefined) {
      updateFields.push(`removed_permissions = $${paramCount}`);
      values.push(removed_permissions);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const query = `
      UPDATE kullanicilar 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions
    `;

    const result = await pool.query(query, values).catch(async (err) => {
      // If sifre_hash column doesn't exist, try updating sifre column
      if (err.code === '42703' && sifre) {
        let altUpdateFields = [];
        let altValues = [];
        let altParamCount = 1;

        const hashedPassword = await bcrypt.hash(sifre, 10);
        altUpdateFields.push(`sifre = $${altParamCount}`);
        altValues.push(hashedPassword);
        altParamCount++;

        if (rol !== undefined) {
          altUpdateFields.push(`rol = $${altParamCount}`);
          altValues.push(rol);
          altParamCount++;
        }

        if (extra_permissions !== undefined) {
          altUpdateFields.push(`extra_permissions = $${altParamCount}`);
          altValues.push(extra_permissions);
          altParamCount++;
        }

        if (removed_permissions !== undefined) {
          altUpdateFields.push(`removed_permissions = $${altParamCount}`);
          altValues.push(removed_permissions);
          altParamCount++;
        }

        altValues.push(id);

        const altQuery = `
          UPDATE kullanicilar 
          SET ${altUpdateFields.join(', ')}
          WHERE id = $${altParamCount}
          RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions
        `;

        return await pool.query(altQuery, altValues);
      }
      throw err;
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent deleting admin user
    const checkResult = await pool.query(
      'SELECT kullanici_adi FROM kullanicilar WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (checkResult.rows[0].kullanici_adi === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    await pool.query('DELETE FROM kullanicilar WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
