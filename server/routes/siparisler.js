const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/siparisler - get all orders (with optional filters)
router.get('/', authenticateToken, async (req, res) => {
  const { tedarikci_adi, durum } = req.query;

  try {
    let query = 'SELECT * FROM siparisler';
    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (tedarikci_adi) {
      conditions.push(`tedarikci_adi ILIKE $${paramCount++}`);
      values.push(`%${tedarikci_adi}%`);
    }

    if (durum) {
      conditions.push(`durum = $${paramCount++}`);
      values.push(durum);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/siparisler - create new order
router.post('/', authenticateToken, async (req, res) => {
  const { siparis_no, tedarikci_adi, aciklama, urunler, durum, otomatik_stoga_aktar } = req.body;

  if (!siparis_no || !tedarikci_adi) {
    return res.status(400).json({ error: 'Order number and supplier are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO siparisler 
       (siparis_no, tedarikci_adi, aciklama, urunler, durum, otomatik_stoga_aktar, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [siparis_no, tedarikci_adi, aciklama || '', JSON.stringify(urunler || []), durum || 'Beklemede', otomatik_stoga_aktar || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Order number already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/siparisler/:id - update order
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { durum, aciklama, urunler, otomatik_stoga_aktar } = req.body;

  try {
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (durum !== undefined) {
      updates.push(`durum = $${paramCount++}`);
      values.push(durum);
    }

    if (aciklama !== undefined) {
      updates.push(`aciklama = $${paramCount++}`);
      values.push(aciklama);
    }

    if (urunler !== undefined) {
      updates.push(`urunler = $${paramCount++}`);
      values.push(JSON.stringify(urunler));
    }

    if (otomatik_stoga_aktar !== undefined) {
      updates.push(`otomatik_stoga_aktar = $${paramCount++}`);
      values.push(otomatik_stoga_aktar);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const result = await db.query(
      `UPDATE siparisler SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
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

// DELETE /api/siparisler/:id - delete order
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM siparisler WHERE id = $1 RETURNING id', [id]);
    
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
