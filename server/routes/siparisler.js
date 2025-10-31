const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { firma, durum } = req.query;
    
    let query = 'SELECT * FROM siparisler WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (firma) {
      query += ` AND tedarikci_adi ILIKE $${paramIndex}`;
      params.push(`%${firma}%`);
      paramIndex++;
    }

    if (durum) {
      query += ` AND durum = $${paramIndex}`;
      params.push(durum);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM siparisler WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      siparis_no,
      tedarikci_id,
      tedarikci_adi,
      olusturan_id,
      olusturan_adi,
      durum,
      toplam_tutar,
      aciklama,
      qr_url,
      barcode_url,
      otomatik_stoga_aktar
    } = req.body;

    if (!siparis_no) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    const result = await pool.query(
      `INSERT INTO siparisler (siparis_no, tedarikci_id, tedarikci_adi, olusturan_id, olusturan_adi, durum, toplam_tutar, aciklama, qr_url, barcode_url, otomatik_stoga_aktar) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        siparis_no,
        tedarikci_id,
        tedarikci_adi || '',
        olusturan_id || req.user.userId,
        olusturan_adi || req.user.username,
        durum || 'Bekliyor',
        toplam_tutar || 0,
        aciklama || '',
        qr_url || '',
        barcode_url || '',
        !!otomatik_stoga_aktar
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Order number already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update order
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tedarikci_id,
      tedarikci_adi,
      durum,
      toplam_tutar,
      aciklama,
      otomatik_stoga_aktar
    } = req.body;

    const result = await pool.query(
      `UPDATE siparisler SET tedarikci_id = $1, tedarikci_adi = $2, durum = $3, toplam_tutar = $4, aciklama = $5, otomatik_stoga_aktar = $6 WHERE id = $7 RETURNING *`,
      [tedarikci_id, tedarikci_adi || '', durum || 'Bekliyor', toplam_tutar || 0, aciklama || '', !!otomatik_stoga_aktar, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM siparisler WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
