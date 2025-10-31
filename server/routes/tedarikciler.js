const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all suppliers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tedarikciler ORDER BY adi');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single supplier
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tedarikciler WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create supplier
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { adi, email, telefon, adres, vergi_no } = req.body;

    if (!adi) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO tedarikciler (adi, email, telefon, adres, vergi_no) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [adi, email || '', telefon || '', adres || '', vergi_no || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update supplier
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { adi, email, telefon, adres, vergi_no } = req.body;

    if (!adi) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'UPDATE tedarikciler SET adi = $1, email = $2, telefon = $3, adres = $4, vergi_no = $5 WHERE id = $6 RETURNING *',
      [adi, email || '', telefon || '', adres || '', vergi_no || '', id]
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

// Delete supplier
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM tedarikciler WHERE id = $1 RETURNING *', [id]);

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
