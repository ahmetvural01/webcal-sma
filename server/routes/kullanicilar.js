const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, kullanici_adi, rol, extra_permissions, removed_permissions FROM kullanicilar ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Create new user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { kullanici_adi, sifre, rol, extra_permissions, removed_permissions } = req.body;

    if (!kullanici_adi || !sifre) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(sifre, 10);

    const result = await db.query(
      `INSERT INTO kullanicilar (kullanici_adi, sifre_hash, rol, extra_permissions, removed_permissions)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`,
      [kullanici_adi, hashedPassword, rol || 'user', extra_permissions || [], removed_permissions || []]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { kullanici_adi, sifre, rol, extra_permissions, removed_permissions } = req.body;

    let query;
    let params;

    if (sifre) {
      // If password is provided, hash and update it
      const hashedPassword = await bcrypt.hash(sifre, 10);
      query = `UPDATE kullanicilar 
               SET kullanici_adi = $1, sifre_hash = $2, rol = $3, extra_permissions = $4, removed_permissions = $5
               WHERE id = $6 
               RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`;
      params = [kullanici_adi, hashedPassword, rol, extra_permissions || [], removed_permissions || [], id];
    } else {
      // Don't update password if not provided
      query = `UPDATE kullanicilar 
               SET kullanici_adi = $1, rol = $2, extra_permissions = $3, removed_permissions = $4
               WHERE id = $5 
               RETURNING id, kullanici_adi, rol, extra_permissions, removed_permissions`;
      params = [kullanici_adi, rol, extra_permissions || [], removed_permissions || [], id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten kullanılıyor' });
    }
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM kullanicilar WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
