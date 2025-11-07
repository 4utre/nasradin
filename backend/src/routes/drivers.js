import express from 'express';
import { query } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all drivers
router.get('/', authenticate, async (req, res) => {
  try {
    const { sort } = req.query;
    let orderBy = 'created_at DESC';
    
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
      orderBy = `${sortField} ${sortOrder}`;
    }

    const result = await query(
      `SELECT * FROM drivers ORDER BY ${orderBy}`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
});

// Get single driver
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM drivers WHERE id = $1',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ message: 'Error fetching driver' });
  }
});

// Create driver
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      driver_name,
      driver_number,
      phone,
      hourly_rate = 0,
      overtime_rate = 0,
      currency = 'IQD',
      assigned_months = [],
      assigned_expense_types = []
    } = req.body;

    if (!driver_name || !driver_number) {
      return res.status(400).json({ message: 'Driver name and number are required' });
    }

    const result = await query(
      `INSERT INTO drivers (driver_name, driver_number, phone, hourly_rate, overtime_rate, currency, assigned_months, assigned_expense_types)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [driver_name, driver_number, phone, hourly_rate, overtime_rate, currency, assigned_months, assigned_expense_types]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating driver:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Driver number already exists' });
    }
    res.status(500).json({ message: 'Error creating driver' });
  }
});

// Update driver
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      driver_name,
      driver_number,
      phone,
      hourly_rate,
      overtime_rate,
      currency,
      assigned_months,
      assigned_expense_types
    } = req.body;

    const result = await query(
      `UPDATE drivers 
       SET driver_name = $1, driver_number = $2, phone = $3, hourly_rate = $4, 
           overtime_rate = $5, currency = $6, assigned_months = $7, 
           assigned_expense_types = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [driver_name, driver_number, phone, hourly_rate, overtime_rate, currency, assigned_months, assigned_expense_types, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating driver:', error);
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Driver number already exists' });
    }
    res.status(500).json({ message: 'Error updating driver' });
  }
});

// Delete driver
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM drivers WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Error deleting driver' });
  }
});

export default router;
