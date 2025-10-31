const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all stock limits
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stok_alt_limitler ORDER BY urun_kodu');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stock limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stock limit by product code
router.get('/:kod', authenticateToken, async (req, res) => {
  try {
    const { kod } = req.params;
    const result = await pool.query(
      'SELECT * FROM stok_alt_limitler WHERE urun_kodu = $1',
      [kod]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock limit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching stock limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update stock limit (upsert)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { urun_kodu, urun_aciklama, alt_limit } = req.body;

    if (!urun_kodu || alt_limit === undefined || alt_limit === null) {
      return res.status(400).json({ error: 'Product code and limit are required' });
    }

    const result = await pool.query(
      `INSERT INTO stok_alt_limitler (urun_kodu, urun_aciklama, alt_limit) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (urun_kodu) 
       DO UPDATE SET urun_aciklama = $2, alt_limit = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [urun_kodu, urun_aciklama || '', alt_limit]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating/updating stock limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stock limit
router.put('/:kod', authenticateToken, async (req, res) => {
  try {
    const { kod } = req.params;
    const { urun_aciklama, alt_limit } = req.body;

    if (alt_limit === undefined || alt_limit === null) {
      return res.status(400).json({ error: 'Limit is required' });
    }

    const result = await pool.query(
      'UPDATE stok_alt_limitler SET urun_aciklama = $1, alt_limit = $2 WHERE urun_kodu = $3 RETURNING *',
      [urun_aciklama || '', alt_limit, kod]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock limit not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating stock limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete stock limit
router.delete('/:kod', authenticateToken, async (req, res) => {
  try {
    const { kod } = req.params;

    const result = await pool.query(
      'DELETE FROM stok_alt_limitler WHERE urun_kodu = $1 RETURNING *',
      [kod]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stock limit not found' });
    }

    res.json({ message: 'Stock limit deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
