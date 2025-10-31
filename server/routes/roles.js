const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticateToken, requireRoot } = require('../middleware/auth');

const router = express.Router();

// Get all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roller ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single role by name
router.get('/:name', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roller WHERE name = $1', [req.params.name]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new role (root only)
router.post('/', [
  authenticateToken,
  requireRoot,
  body('name').trim().notEmpty().withMessage('Role name is required'),
  body('label').trim().notEmpty().withMessage('Role label is required'),
  body('permissions').isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, label, color, permissions, fixed } = req.body;

  try {
    const result = await pool.query(
      'INSERT INTO roller (name, label, color, permissions, fixed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, label, color || '#00b7b7', permissions || [], fixed || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Role already exists' });
    }
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update role (root only)
router.put('/:id', [
  authenticateToken,
  requireRoot,
  body('name').optional().trim().notEmpty(),
  body('label').optional().trim().notEmpty(),
  body('permissions').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, label, color, permissions, fixed } = req.body;

  try {
    // Check if role is fixed (admin roles shouldn't be modified)
    const checkResult = await pool.query('SELECT fixed FROM roller WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    if (checkResult.rows[0].fixed) {
      return res.status(403).json({ error: 'Cannot modify fixed role' });
    }

    const result = await pool.query(
      `UPDATE roller 
       SET name = COALESCE($1, name),
           label = COALESCE($2, label),
           color = COALESCE($3, color),
           permissions = COALESCE($4, permissions),
           fixed = COALESCE($5, fixed)
       WHERE id = $6
       RETURNING *`,
      [name, label, color, permissions, fixed, id]
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

// Delete role (root only)
router.delete('/:id', authenticateToken, requireRoot, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if role is fixed
    const checkResult = await pool.query('SELECT fixed FROM roller WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    if (checkResult.rows[0].fixed) {
      return res.status(403).json({ error: 'Cannot delete fixed role' });
    }

    await pool.query('DELETE FROM roller WHERE id = $1', [id]);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
