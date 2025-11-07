import pool from './index.js';

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Creating database tables...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Drivers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        driver_name VARCHAR(255) NOT NULL,
        driver_number VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(50),
        hourly_rate DECIMAL(10, 2) DEFAULT 0,
        overtime_rate DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'IQD',
        assigned_months TEXT[],
        assigned_expense_types TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Employees table
    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_name VARCHAR(255) NOT NULL,
        employee_number VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(50),
        position VARCHAR(255),
        salary DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'IQD',
        assigned_months TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Expense Types table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_types (
        id SERIAL PRIMARY KEY,
        type_name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Expenses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        expense_date DATE NOT NULL,
        driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
        driver_name VARCHAR(255),
        expense_type VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'IQD',
        description TEXT,
        receipt_url VARCHAR(500),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_driver ON expenses(driver_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type)');

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run migrations
createTables()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
