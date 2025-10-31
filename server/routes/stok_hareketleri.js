const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all stock movements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stok_hareketleri ORDER BY tarih DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stock movements by product code
router.get('/product/:kod', authenticateToken, async (req, res) => {
  try {
    const { kod } = req.params;
    const result = await pool.query(
      'SELECT * FROM stok_hareketleri WHERE urun_kodu = $1 ORDER BY tarih DESC',
      [kod]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create stock movement
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      urun_kodu,
      urun_aciklama,
      islem_turu,
      giris_miktari,
      cikis_miktari,
      ek_aciklama,
      kullanici_adi
    } = req.body;

    if (!urun_kodu || !urun_aciklama || !islem_turu) {
      return res.status(400).json({ error: 'Product code, description, and operation type are required' });
    }

    const result = await pool.query(
      'INSERT INTO stok_hareketleri (urun_kodu, urun_aciklama, islem_turu, giris_miktari, cikis_miktari, ek_aciklama, kullanici_adi, tarih) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        urun_kodu,
        urun_aciklama,
        islem_turu,
        giris_miktari || 0,
        cikis_miktari || 0,
        ek_aciklama || '',
        kullanici_adi || req.user.username,
        new Date()
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete stock movement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM stok_hareketleri WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }

    res.json({ message: 'Stock movement deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock movement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stock movement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      urun_kodu,
      urun_aciklama,
      islem_turu,
      giris_miktari,
      cikis_miktari,
      ek_aciklama
    } = req.body;

    const result = await pool.query(
      'UPDATE stok_hareketleri SET urun_kodu = $1, urun_aciklama = $2, islem_turu = $3, giris_miktari = $4, cikis_miktari = $5, ek_aciklama = $6 WHERE id = $7 RETURNING *',
      [urun_kodu, urun_aciklama, islem_turu, giris_miktari || 0, cikis_miktari || 0, ek_aciklama || '', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating stock movement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
