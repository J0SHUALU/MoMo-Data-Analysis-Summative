const express = require('express');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql2/promise');
const xml2js = require('xml2js');
const moment = require('moment');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'momo_analysis',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Routes
app.get('/', async (req, res) => {
  try {
    const [transactions] = await pool.query('SELECT * FROM transactions ORDER BY transaction_date DESC LIMIT 10');
    const [types] = await pool.query('SELECT * FROM transaction_types');
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as totalTransactions,
        SUM(amount) as totalAmount,
        AVG(amount) as avgTransaction,
        SUM(fee) as totalFees
      FROM transactions
    `);

    res.render('index', {
      transactions,
      types,
      stats: stats[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Transaction details page
app.get('/transaction/:id', async (req, res) => {
    try {
        const [transaction] = await pool.query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
        
        if (!transaction.length) {
            return res.status(404).send('Transaction not found');
        }

        // Get transaction types for the dropdown
        const [types] = await pool.query('SELECT * FROM transaction_types ORDER BY type_name');
        
        res.render('transaction_details', { 
            transaction: transaction[0],
            types: types
        });
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.status(500).send('Error fetching transaction details');
    }
});

// Import page
app.get('/import', (req, res) => {
    res.render('import');
});

// Import history API endpoint
app.get('/api/import-history', async (req, res) => {
    try {
        const [history] = await pool.query(`
            SELECT 
                filename,
                import_date,
                status,
                records_imported
            FROM import_history
            ORDER BY import_date DESC
            LIMIT 10
        `);
        res.json(history);
    } catch (error) {
        console.error('Error fetching import history:', error);
        res.status(500).json({ error: 'Failed to fetch import history' });
    }
});

// Import history page
app.get('/import-history', async (req, res, next) => {
    try {
        const [imports] = await pool.query(
            'SELECT * FROM import_history ORDER BY import_date DESC'
        );
        res.render('import_history', { imports });
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        message: err.message || 'An error occurred',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 