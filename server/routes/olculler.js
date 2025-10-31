const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all measurements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM olculler ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single measurement
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM olculler WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching measurement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create measurement
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { marka, model, a, b, c, j, k, l, m, d, e, f, g, h } = req.body;

    const result = await pool.query(
      'INSERT INTO olculler (marka, model, a, b, c, j, k, l, m, d, e, f, g, h) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *',
      [marka, model, a, b, c, j, k, l, m, d, e, f, g, h]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating measurement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update measurement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { marka, model, a, b, c, j, k, l, m, d, e, f, g, h } = req.body;

    const result = await pool.query(
      'UPDATE olculler SET marka = $1, model = $2, a = $3, b = $4, c = $5, j = $6, k = $7, l = $8, m = $9, d = $10, e = $11, f = $12, g = $13, h = $14 WHERE id = $15 RETURNING *',
      [marka, model, a, b, c, j, k, l, m, d, e, f, g, h, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating measurement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete measurement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM olculler WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Measurement not found' });
    }

    res.json({ message: 'Measurement deleted successfully' });
  } catch (error) {
    console.error('Error deleting measurement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
