const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/tedarikciler - get all suppliers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tedarikciler ORDER BY adi ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tedarikciler - create new supplier
router.post('/', authenticateToken, async (req, res) => {
  const { adi, email, telefon, adres, vergi_no } = req.body;

  if (!adi) {
    return res.status(400).json({ error: 'Supplier name is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO tedarikciler (adi, email, telefon, adres, vergi_no) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [adi, email || '', telefon || '', adres || '', vergi_no || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tedarikciler/:id - update supplier
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { adi, email, telefon, adres, vergi_no } = req.body;

  try {
    const result = await db.query(
      `UPDATE tedarikciler 
       SET adi = $1, email = $2, telefon = $3, adres = $4, vergi_no = $5
       WHERE id = $6 
       RETURNING *`,
      [adi, email, telefon, adres, vergi_no, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tedarikciler/:id - delete supplier
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM tedarikciler WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
