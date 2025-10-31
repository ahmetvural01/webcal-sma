const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all stok_takip records
router.get('/takip', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stok_takip ORDER BY islem_tarihi DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stok_takip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stok by product code
router.get('/takip/:urunKodu', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stok_takip WHERE urun_kodu = $1 ORDER BY islem_tarihi DESC',
      [req.params.urunKodu]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stok:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create stok record
router.post('/takip', [
  authenticateToken,
  body('urun_kodu').trim().notEmpty().withMessage('Urun kodu is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    urun_kodu,
    urun_aciklama,
    islem_turu,
    giris_miktari,
    cikis_miktari,
    mevcut_stok,
    ek_aciklama,
    kullanici
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO stok_takip (
        urun_kodu, urun_aciklama, islem_turu, giris_miktari, 
        cikis_miktari, mevcut_stok, ek_aciklama, kullanici, islem_tarihi
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        urun_kodu,
        urun_aciklama || '',
        islem_turu || '',
        giris_miktari || 0,
        cikis_miktari || 0,
        mevcut_stok || 0,
        ek_aciklama || '',
        kullanici || req.user.username
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating stok record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stok record
router.put('/takip/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const {
    urun_kodu,
    urun_aciklama,
    islem_turu,
    giris_miktari,
    cikis_miktari,
    mevcut_stok,
    ek_aciklama
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE stok_takip 
       SET urun_kodu = COALESCE($1, urun_kodu),
           urun_aciklama = COALESCE($2, urun_aciklama),
           islem_turu = COALESCE($3, islem_turu),
           giris_miktari = COALESCE($4, giris_miktari),
           cikis_miktari = COALESCE($5, cikis_miktari),
           mevcut_stok = COALESCE($6, mevcut_stok),
           ek_aciklama = COALESCE($7, ek_aciklama)
       WHERE id = $8
       RETURNING *`,
      [urun_kodu, urun_aciklama, islem_turu, giris_miktari, cikis_miktari, mevcut_stok, ek_aciklama, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stok record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating stok:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete stok record
router.delete('/takip/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM stok_takip WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stok record not found' });
    }

    res.json({ message: 'Stok record deleted successfully' });
  } catch (error) {
    console.error('Error deleting stok:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stok limits
router.get('/limits', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stok_limits ORDER BY urun_kodu');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stok limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stok limit by product code
router.get('/limits/:urunKodu', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM stok_limits WHERE urun_kodu = $1',
      [req.params.urunKodu]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Limit not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stok limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set/Update stok limit
router.put('/limits/:urunKodu', authenticateToken, async (req, res) => {
  const { urunKodu } = req.params;
  const { alt_limit } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO stok_limits (urun_kodu, alt_limit, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (urun_kodu)
       DO UPDATE SET alt_limit = $2, updated_at = NOW()
       RETURNING *`,
      [urunKodu, alt_limit || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error setting stok limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete stok limit
router.delete('/limits/:urunKodu', authenticateToken, async (req, res) => {
  const { urunKodu } = req.params;

  try {
    const result = await pool.query('DELETE FROM stok_limits WHERE urun_kodu = $1 RETURNING *', [urunKodu]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Limit not found' });
    }

    res.json({ message: 'Stok limit deleted successfully' });
  } catch (error) {
    console.error('Error deleting stok limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get distinct product codes
router.get('/products/codes', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT urun_kodu, urun_aciklama FROM stok_takip ORDER BY urun_kodu'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
