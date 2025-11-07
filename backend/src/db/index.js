import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Remove SSL mode from connection string if present
const connectionString = process.env.DATABASE_URL?.replace('?sslmode=require', '');

const pool = new Pool({
  connectionString: connectionString,
  ssl: false // Disable SSL for local PostgreSQL
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export default pool;
