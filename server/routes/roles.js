const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/roles - get all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roles - create new role
router.post('/', authenticateToken, async (req, res) => {
  const { name, label, color, permissions, fixed } = req.body;

  if (!name || !label) {
    return res.status(400).json({ error: 'Name and label are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO roles (name, label, color, permissions, fixed) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, label, color || '#00b7b7', JSON.stringify(permissions || []), !!fixed]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating role:', error);
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Role name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roles/:id - update role
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, label, color, permissions, fixed } = req.body;

  try {
    const result = await db.query(
      `UPDATE roles 
       SET name = $1, label = $2, color = $3, permissions = $4, fixed = $5
       WHERE id = $6 
       RETURNING *`,
      [name, label, color, JSON.stringify(permissions), !!fixed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/roles/:id - delete role
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM roles WHERE id = $1 AND fixed = false RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found or is a fixed role' });
    }

    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
