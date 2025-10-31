const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all tedarikciler
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tedarikciler ORDER BY adi ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tedarikciler:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Create new tedarikci
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { adi, email, telefon, adres, vergi_no } = req.body;

    const result = await db.query(
      `INSERT INTO tedarikciler (adi, email, telefon, adres, vergi_no)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [adi, email, telefon, adres, vergi_no]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tedarikci:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
