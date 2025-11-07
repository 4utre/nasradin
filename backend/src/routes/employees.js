import express from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all employees
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Get single employee
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee' });
  }
});

// Create employee
router.post('/', authenticate, async (req, res) => {
  try {
    const { employee_name, employee_number, phone, position, salary = 0, currency = 'IQD', assigned_months = [] } = req.body;
    if (!employee_name || !employee_number) {
      return res.status(400).json({ message: 'Employee name and number are required' });
    }
    const result = await query(
      `INSERT INTO employees (employee_name, employee_number, phone, position, salary, currency, assigned_months)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employee_name, employee_number, phone, position, salary, currency, assigned_months]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Employee number already exists' });
    res.status(500).json({ message: 'Error creating employee' });
  }
});

// Update employee
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { employee_name, employee_number, phone, position, salary, currency, assigned_months } = req.body;
    const result = await query(
      `UPDATE employees SET employee_name = $1, employee_number = $2, phone = $3, position = $4,
       salary = $5, currency = $6, assigned_months = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [employee_name, employee_number, phone, position, salary, currency, assigned_months, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ message: 'Employee number already exists' });
    res.status(500).json({ message: 'Error updating employee' });
  }
});

// Delete employee
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('DELETE FROM employees WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee' });
  }
});

export default router;
