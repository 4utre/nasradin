import express from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM expense_types ORDER BY type_name ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense types' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { type_name, description, category } = req.body;
    if (!type_name) return res.status(400).json({ message: 'Type name is required' });
    const result = await query(
      'INSERT INTO expense_types (type_name, description, category) VALUES ($1, $2, $3) RETURNING *',
      [type_name, description, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Expense type already exists' });
    res.status(500).json({ message: 'Error creating expense type' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { type_name, description, category } = req.body;
    const result = await query(
      'UPDATE expense_types SET type_name = $1, description = $2, category = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [type_name, description, category, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Expense type not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense type' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('DELETE FROM expense_types WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Expense type not found' });
    res.json({ message: 'Expense type deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense type' });
  }
});

export default router;
