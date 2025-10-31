const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all olculler
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM olculler ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching olculler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single olcu by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM olculler WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Olcu not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching olcu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new olcu
router.post('/', [
  authenticateToken,
  body('marka').trim().notEmpty().withMessage('Marka is required'),
  body('model').trim().notEmpty().withMessage('Model is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { marka, model, a, b, c, j, k, l, m, d, e, f, g, h } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO olculler (marka, model, a, b, c, j, k, l, m, d, e, f, g, h, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       RETURNING *`,
      [marka, model, a, b, c, j, k, l, m, d, e, f, g, h]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating olcu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update olcu
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { marka, model, a, b, c, j, k, l, m, d, e, f, g, h } = req.body;

  try {
    const result = await pool.query(
      `UPDATE olculler 
       SET marka = COALESCE($1, marka),
           model = COALESCE($2, model),
           a = COALESCE($3, a),
           b = COALESCE($4, b),
           c = COALESCE($5, c),
           j = COALESCE($6, j),
           k = COALESCE($7, k),
           l = COALESCE($8, l),
           m = COALESCE($9, m),
           d = COALESCE($10, d),
           e = COALESCE($11, e),
           f = COALESCE($12, f),
           g = COALESCE($13, g),
           h = COALESCE($14, h)
       WHERE id = $15
       RETURNING *`,
      [marka, model, a, b, c, j, k, l, m, d, e, f, g, h, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Olcu not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating olcu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete olcu
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM olculler WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Olcu not found' });
    }

    res.json({ message: 'Olcu deleted successfully' });
  } catch (error) {
    console.error('Error deleting olcu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
