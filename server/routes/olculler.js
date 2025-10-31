const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/olculler - get all measurements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM olculler ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching olculler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/olculler - create new measurement
router.post('/', authenticateToken, async (req, res) => {
  const { marka, model, a, b, c, j, k, l, m, d, e, f, g, h } = req.body;

  if (!marka || !model) {
    return res.status(400).json({ error: 'Marka and model are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO olculler (marka, model, a, b, c, j, k, l, m, d, e, f, g, h, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()) 
       RETURNING *`,
      [marka, model, a, b, c, j, k, l, m, d, e, f, g, h]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating measurement:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/olculler/:id - update measurement
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { marka, model, a, b, c, j, k, l, m, d, e, f, g, h } = req.body;

  try {
    const result = await db.query(
      `UPDATE olculler 
       SET marka = $1, model = $2, a = $3, b = $4, c = $5, j = $6, k = $7, l = $8, m = $9, 
           d = $10, e = $11, f = $12, g = $13, h = $14
       WHERE id = $15 
       RETURNING *`,
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

// DELETE /api/olculler/:id - delete measurement
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM olculler WHERE id = $1 RETURNING id', [id]);
    
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
