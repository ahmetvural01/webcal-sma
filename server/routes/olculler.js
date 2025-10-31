const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all olculler
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM olculler ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching olculler:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Create new olcu
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { marka, model, a, b, c, d, e, f, g, h, j, k, l, m } = req.body;

    const result = await db.query(
      `INSERT INTO olculler (marka, model, a, b, c, d, e, f, g, h, j, k, l, m)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [marka, model, a, b, c, d, e, f, g, h, j, k, l, m]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating olcu:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Update olcu
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { marka, model, a, b, c, d, e, f, g, h, j, k, l, m } = req.body;

    const result = await db.query(
      `UPDATE olculler 
       SET marka = $1, model = $2, a = $3, b = $4, c = $5, d = $6, e = $7, f = $8, g = $9, h = $10, j = $11, k = $12, l = $13, m = $14
       WHERE id = $15 RETURNING *`,
      [marka, model, a, b, c, d, e, f, g, h, j, k, l, m, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ölçü bulunamadı' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating olcu:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Delete olcu
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM olculler WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ölçü bulunamadı' });
    }

    res.json({ message: 'Ölçü silindi' });
  } catch (error) {
    console.error('Error deleting olcu:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
