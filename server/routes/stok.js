const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all stok kayitlari
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stok_kayitlari ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stok:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Get stok limits
router.get('/limits', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stok_alt_limitler');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stok limits:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Create stok entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { urun_kodu, urun_aciklama, islem_turu, giris_miktari, cikis_miktari, ek_aciklama, kullanici } = req.body;

    const result = await db.query(
      `INSERT INTO stok_kayitlari (urun_kodu, urun_aciklama, islem_turu, giris_miktari, cikis_miktari, ek_aciklama, kullanici)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [urun_kodu, urun_aciklama, islem_turu, giris_miktari || 0, cikis_miktari || 0, ek_aciklama, kullanici]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating stok entry:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Set stok limit
router.post('/limits', authenticateToken, async (req, res) => {
  try {
    const { urun_kodu, urun_aciklama, alt_limit } = req.body;

    const result = await db.query(
      `INSERT INTO stok_alt_limitler (urun_kodu, urun_aciklama, alt_limit)
       VALUES ($1, $2, $3)
       ON CONFLICT (urun_kodu) DO UPDATE SET alt_limit = $3, urun_aciklama = $2
       RETURNING *`,
      [urun_kodu, urun_aciklama, alt_limit]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error setting stok limit:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Delete stok entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM stok_kayitlari WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    res.json({ message: 'Kayıt silindi' });
  } catch (error) {
    console.error('Error deleting stok entry:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
