// ============================================================
//  Spendly – Expense Tracker  |  Express + MySQL API
//  Start:  npm install  &&  npm start
//  Then open  http://localhost:3000
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the dashboard (index.html + assets) from this folder,
// so the frontend and API share one origin — no CORS issues.
app.use(express.static(__dirname));

// ---- Database connection pool ------------------------------
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'spendly',
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,     // return DATE columns as 'YYYY-MM-DD' strings
  decimalNumbers: true,  // return DECIMAL columns as JS numbers
});

// Map a DB row to the shape the dashboard's JS expects.
function toClient(row) {
  return {
    id: row.id,
    desc: row.description,
    cat: row.category,
    type: row.tx_type,
    amt: Number(row.amount),
    date: row.tx_date,
    status: row.status,
  };
}

const TYPES = ['income', 'expense'];
const STATUSES = ['completed', 'pending', 'failed'];

// ---- Routes ------------------------------------------------

// List all transactions (newest first)
app.get('/api/transactions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM transactions ORDER BY tx_date DESC, id DESC'
    );
    res.json(rows.map(toClient));
  } catch (err) {
    console.error('GET /api/transactions', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create a transaction
app.post('/api/transactions', async (req, res) => {
  try {
    const { desc, cat, type, amt, date, status } = req.body || {};

    // Validation
    if (!desc || String(desc).trim() === '') {
      return res.status(400).json({ error: 'description is required' });
    }
    const amount = Number(amt);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }
    if (!date) return res.status(400).json({ error: 'date is required' });
    if (!TYPES.includes(type)) return res.status(400).json({ error: 'invalid type' });
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'invalid status' });

    // Parameterized query — prevents SQL injection.
    const [result] = await pool.query(
      `INSERT INTO transactions (description, category, tx_type, amount, tx_date, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [String(desc).trim(), cat || 'Other', type, amount, date, status]
    );
    const [rows] = await pool.query('SELECT * FROM transactions WHERE id = ?', [result.insertId]);
    res.status(201).json(toClient(rows[0]));
  } catch (err) {
    console.error('POST /api/transactions', err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// Delete a transaction
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM transactions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/transactions', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Spendly running at http://localhost:${PORT}`);
});
