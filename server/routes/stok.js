const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/stok/hareketler - get all stock movements
router.get('/hareketler', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stok_hareketleri ORDER BY tarih ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stok/hareketler - create new stock movement
router.post('/hareketler', authenticateToken, async (req, res) => {
  const { urun_kodu, urun_aciklama, islem_turu, giris_miktari, cikis_miktari, ek_aciklama } = req.body;

  if (!urun_kodu || !urun_aciklama || !islem_turu) {
    return res.status(400).json({ error: 'Product code, description, and operation type are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO stok_hareketleri 
       (urun_kodu, urun_aciklama, islem_turu, giris_miktari, cikis_miktari, ek_aciklama, tarih, kullanici_adi) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7) 
       RETURNING *`,
      [urun_kodu, urun_aciklama, islem_turu, giris_miktari || 0, cikis_miktari || 0, ek_aciklama || '', req.user.username]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating stock movement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/stok/hareketler/:id - update stock movement
router.put('/hareketler/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { tarih, islem_turu, giris_miktari, cikis_miktari, ek_aciklama } = req.body;

  try {
    const result = await db.query(
      `UPDATE stok_hareketleri 
       SET tarih = $1, islem_turu = $2, giris_miktari = $3, cikis_miktari = $4, ek_aciklama = $5
       WHERE id = $6 
       RETURNING *`,
      [tarih, islem_turu, giris_miktari, cikis_miktari, ek_aciklama, id]
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

// DELETE /api/stok/hareketler/:id - delete stock movement
router.delete('/hareketler/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM stok_hareketleri WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock movement not found' });
    }

    res.json({ message: 'Stock movement deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock movement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/stok/hareketler/by-product/:urun_kodu - delete all movements for a product
router.delete('/hareketler/by-product/:urun_kodu', authenticateToken, async (req, res) => {
  const { urun_kodu } = req.params;

  try {
    await db.query('DELETE FROM stok_hareketleri WHERE urun_kodu = $1', [urun_kodu]);
    res.json({ message: 'All stock movements for product deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock movements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/stok/hareketler/update-product - update product code/description across all movements
router.put('/hareketler/update-product', authenticateToken, async (req, res) => {
  const { old_urun_kodu, new_urun_kodu, new_urun_aciklama } = req.body;

  if (!old_urun_kodu || !new_urun_kodu || !new_urun_aciklama) {
    return res.status(400).json({ error: 'Old code, new code, and new description are required' });
  }

  try {
    await db.query(
      'UPDATE stok_hareketleri SET urun_kodu = $1, urun_aciklama = $2 WHERE urun_kodu = $3',
      [new_urun_kodu, new_urun_aciklama, old_urun_kodu]
    );

    res.json({ message: 'Product information updated successfully' });
  } catch (error) {
    console.error('Error updating product information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stok/alt-limitler - get all stock limits
router.get('/alt-limitler', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM stok_alt_limitler');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/stok/alt-limitler - upsert stock limit
router.post('/alt-limitler', authenticateToken, async (req, res) => {
  const { urun_kodu, alt_limit } = req.body;

  if (!urun_kodu || alt_limit === undefined) {
    return res.status(400).json({ error: 'Product code and limit are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO stok_alt_limitler (urun_kodu, alt_limit) 
       VALUES ($1, $2) 
       ON CONFLICT (urun_kodu) DO UPDATE SET alt_limit = $2 
       RETURNING *`,
      [urun_kodu, alt_limit]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error upserting stock limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/stok/alt-limitler/:urun_kodu - delete stock limit
router.delete('/alt-limitler/:urun_kodu', authenticateToken, async (req, res) => {
  const { urun_kodu } = req.params;

  try {
    await db.query('DELETE FROM stok_alt_limitler WHERE urun_kodu = $1', [urun_kodu]);
    res.json({ message: 'Stock limit deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
