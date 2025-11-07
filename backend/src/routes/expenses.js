import express from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { sort } = req.query;
    let orderBy = 'expense_date DESC';
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
      orderBy = `${sortField} ${sortOrder}`;
    }
    const result = await query(`SELECT * FROM expenses ORDER BY ${orderBy}`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expense' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { expense_date, driver_id, driver_name, expense_type, amount, currency = 'IQD', description, receipt_url } = req.body;
    if (!expense_date || !expense_type || !amount) {
      return res.status(400).json({ message: 'Date, type, and amount are required' });
    }
    const result = await query(
      `INSERT INTO expenses (expense_date, driver_id, driver_name, expense_type, amount, currency, description, receipt_url, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [expense_date, driver_id, driver_name, expense_type, amount, currency, description, receipt_url, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const { expense_date, driver_id, driver_name, expense_type, amount, currency, description, receipt_url } = req.body;
    const result = await query(
      `UPDATE expenses SET expense_date = $1, driver_id = $2, driver_name = $3, expense_type = $4,
       amount = $5, currency = $6, description = $7, receipt_url = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [expense_date, driver_id, driver_name, expense_type, amount, currency, description, receipt_url, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('DELETE FROM expenses WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

export default router;
