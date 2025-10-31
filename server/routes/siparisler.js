const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all siparisler (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { firma, durum } = req.query;
    let query = 'SELECT * FROM siparisler';
    const params = [];
    const conditions = [];

    if (firma) {
      conditions.push(`tedarikci_adi ILIKE $${params.length + 1}`);
      params.push(`%${firma}%`);
    }

    if (durum) {
      conditions.push(`durum = $${params.length + 1}`);
      params.push(durum);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching siparisler:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Get last siparis number
router.get('/last-number', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT siparis_no FROM siparisler ORDER BY created_at DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.json({ lastNumber: '0000' });
    }

    const siparisNo = result.rows[0].siparis_no;
    const lastNumber = siparisNo ? siparisNo.substring(5) : '0000';
    
    res.json({ lastNumber });
  } catch (error) {
    console.error('Error fetching last siparis number:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Create new siparis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { siparis_no, tedarikci_adi, aciklama, urunler, durum, olusturan_kullanici } = req.body;

    const result = await db.query(
      `INSERT INTO siparisler (siparis_no, tedarikci_adi, aciklama, urunler, durum, olusturan_kullanici)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [siparis_no, tedarikci_adi, aciklama, JSON.stringify(urunler), durum || 'beklemede', olusturan_kullanici]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating siparis:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update siparis
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { siparis_no, tedarikci_adi, aciklama, urunler, durum } = req.body;

    const result = await db.query(
      `UPDATE siparisler 
       SET siparis_no = $1, tedarikci_adi = $2, aciklama = $3, urunler = $4, durum = $5
       WHERE id = $6 RETURNING *`,
      [siparis_no, tedarikci_adi, aciklama, JSON.stringify(urunler), durum, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating siparis:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Delete siparis
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM siparisler WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sipariş bulunamadı' });
    }

    res.json({ message: 'Sipariş silindi' });
  } catch (error) {
    console.error('Error deleting siparis:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
