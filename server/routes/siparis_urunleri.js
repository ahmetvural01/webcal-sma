const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all order products
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { siparis_id } = req.query;
    
    let query = 'SELECT * FROM siparis_urunleri';
    const params = [];

    if (siparis_id) {
      query += ' WHERE siparis_id = $1';
      params.push(siparis_id);
    }

    query += ' ORDER BY id';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order products by order ID
router.get('/order/:siparis_id', authenticateToken, async (req, res) => {
  try {
    const { siparis_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM siparis_urunleri WHERE siparis_id = $1 ORDER BY id',
      [siparis_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order product
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { siparis_id, urun_kodu, urun_adi, miktar, birim_fiyat, toplam } = req.body;

    if (!siparis_id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const result = await pool.query(
      'INSERT INTO siparis_urunleri (siparis_id, urun_kodu, urun_adi, miktar, birim_fiyat, toplam) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [siparis_id, urun_kodu || '', urun_adi || '', miktar || 0, birim_fiyat || 0, toplam || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order product:', error);
    if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid order ID' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update order product
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { urun_kodu, urun_adi, miktar, birim_fiyat, toplam } = req.body;

    const result = await pool.query(
      'UPDATE siparis_urunleri SET urun_kodu = $1, urun_adi = $2, miktar = $3, birim_fiyat = $4, toplam = $5 WHERE id = $6 RETURNING *',
      [urun_kodu || '', urun_adi || '', miktar || 0, birim_fiyat || 0, toplam || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating order product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete order product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM siparis_urunleri WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order product not found' });
    }

    res.json({ message: 'Order product deleted successfully' });
  } catch (error) {
    console.error('Error deleting order product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
