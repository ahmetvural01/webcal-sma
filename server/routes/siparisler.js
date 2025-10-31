const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all siparisler with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { firma, durum } = req.query;
    
    let query = 'SELECT * FROM siparisler';
    let conditions = [];
    let params = [];
    let paramCount = 1;

    if (firma) {
      conditions.push(`tedarikci_adi ILIKE $${paramCount}`);
      params.push(`%${firma}%`);
      paramCount++;
    }

    if (durum) {
      conditions.push(`durum = $${paramCount}`);
      params.push(durum);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching siparisler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single siparis by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM siparisler WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Siparis not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching siparis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new siparis
router.post('/', [
  authenticateToken,
  body('siparis_no').trim().notEmpty().withMessage('Siparis no is required'),
  body('tedarikci_adi').trim().notEmpty().withMessage('Tedarikci is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    siparis_no, 
    tedarikci_adi, 
    aciklama, 
    urunler, 
    durum,
    otomatik_stoga_aktar
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO siparisler (siparis_no, tedarikci_adi, aciklama, urunler, durum, otomatik_stoga_aktar, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        siparis_no, 
        tedarikci_adi, 
        aciklama || '', 
        JSON.stringify(urunler || []), 
        durum || 'beklemede',
        otomatik_stoga_aktar || false
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating siparis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update siparis
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { 
    siparis_no, 
    tedarikci_adi, 
    aciklama, 
    urunler, 
    durum,
    otomatik_stoga_aktar
  } = req.body;

  try {
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (siparis_no !== undefined) {
      updateFields.push(`siparis_no = $${paramCount}`);
      values.push(siparis_no);
      paramCount++;
    }

    if (tedarikci_adi !== undefined) {
      updateFields.push(`tedarikci_adi = $${paramCount}`);
      values.push(tedarikci_adi);
      paramCount++;
    }

    if (aciklama !== undefined) {
      updateFields.push(`aciklama = $${paramCount}`);
      values.push(aciklama);
      paramCount++;
    }

    if (urunler !== undefined) {
      updateFields.push(`urunler = $${paramCount}`);
      values.push(JSON.stringify(urunler));
      paramCount++;
    }

    if (durum !== undefined) {
      updateFields.push(`durum = $${paramCount}`);
      values.push(durum);
      paramCount++;
    }

    if (otomatik_stoga_aktar !== undefined) {
      updateFields.push(`otomatik_stoga_aktar = $${paramCount}`);
      values.push(otomatik_stoga_aktar);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const query = `
      UPDATE siparisler 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Siparis not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating siparis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete siparis
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM siparisler WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Siparis not found' });
    }

    res.json({ message: 'Siparis deleted successfully' });
  } catch (error) {
    console.error('Error deleting siparis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tedarikciler
router.get('/tedarikciler/list', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tedarikciler ORDER BY adi');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tedarikciler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new tedarikci
router.post('/tedarikciler', [
  authenticateToken,
  body('adi').trim().notEmpty().withMessage('Tedarikci adi is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { adi, email, telefon, adres, vergi_no } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tedarikciler (adi, email, telefon, adres, vergi_no)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [adi, email || '', telefon || '', adres || '', vergi_no || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating tedarikci:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
