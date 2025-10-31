const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Get all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roller ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create role
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, label, color, permissions, fixed } = req.body;

    if (!name || !label) {
      return res.status(400).json({ error: 'Name and label are required' });
    }

    const result = await pool.query(
      'INSERT INTO roller (name, label, color, permissions, fixed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, label, color || '#00b7b7', permissions || [], !!fixed]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating role:', error);
    if (error.code === '23505') { // Unique violation
      res.status(409).json({ error: 'Role with this name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update role
router.put('/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;
    const { label, color, permissions } = req.body;

    const result = await pool.query(
      'UPDATE roller SET label = $1, color = $2, permissions = $3 WHERE name = $4 RETURNING *',
      [label, color, permissions || [], name]
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

// Delete role
router.delete('/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;

    // Check if role is fixed
    const roleCheck = await pool.query('SELECT fixed FROM roller WHERE name = $1', [name]);
    
    if (roleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (roleCheck.rows[0].fixed) {
      return res.status(403).json({ error: 'Cannot delete fixed role' });
    }

    await pool.query('DELETE FROM roller WHERE name = $1', [name]);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
