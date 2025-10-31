const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all order logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { siparis_id } = req.query;
    
    let query = 'SELECT * FROM siparis_log';
    const params = [];

    if (siparis_id) {
      query += ' WHERE siparis_id = $1';
      params.push(siparis_id);
    }

    query += ' ORDER BY tarih DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order logs by order ID
router.get('/order/:siparis_id', authenticateToken, async (req, res) => {
  try {
    const { siparis_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM siparis_log WHERE siparis_id = $1 ORDER BY tarih DESC',
      [siparis_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching order logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create order log
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { siparis_id, durum, aciklama, kullanici_adi } = req.body;

    if (!siparis_id || !durum) {
      return res.status(400).json({ error: 'Order ID and status are required' });
    }

    const result = await pool.query(
      'INSERT INTO siparis_log (siparis_id, durum, aciklama, kullanici_adi, tarih) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [siparis_id, durum, aciklama || '', kullanici_adi || req.user.username, new Date()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating order log:', error);
    if (error.code === '23503') { // Foreign key violation
      res.status(400).json({ error: 'Invalid order ID' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete order log
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM siparis_log WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order log not found' });
    }

    res.json({ message: 'Order log deleted successfully' });
  } catch (error) {
    console.error('Error deleting order log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
