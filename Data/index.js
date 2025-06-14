// API for managing mobile money transactions and SMS imports
// This code sets up an Express server with endpoints to manage mobile money transactions and import SMS messages.
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// DB Connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'momodata'
});

// 1. Get all transactions
app.get('/api/transactions', (req, res) => {
  const query = `SELECT * FROM transactions ORDER BY date DESC`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: results });
  });
});

// 2. Get transaction by ID
app.get('/api/transactions/:id', (req, res) => {
  const query = `SELECT * FROM transactions WHERE id = ?`;
  db.query(query, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ data: results[0] });
  });
});

// 3. Add new transaction
app.post('/api/transactions', (req, res) => {
  const { date, amount, type, category, description } = req.body;
  if (!date || !amount || !type || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const query = `INSERT INTO transactions (date, amount, type, category, description)
    VALUES (?, ?, ?, ?, ?)`;
  db.query(query, [date, amount, type, category, description], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Transaction added', id: result.insertId });
  });
});

// 4. Import SMS messages
app.post('/api/import-sms', (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages' });

  let imported = { raw: 0, transactions: 0 };

  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ error: err.message });

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).json({ error: err.message });
      }

      const rawInsert = `INSERT INTO raw_sms_messages (body, date, address, processed) VALUES (?, ?, ?, 0)`;
      const txInsert = `
        INSERT INTO transactions (date, amount, type, category, description, raw_sms_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      let tasks = messages.map(msg => new Promise((resolve, reject) => {
        connection.query(rawInsert, [msg.body, msg.date, msg.address], (err, rawResult) => {
          if (err) return reject(err);
          imported.raw++;
          const rawSmsId = rawResult.insertId;

          if (isMobileMoneyMessage(msg.body)) {
            const tx = extractTransactionDetails(msg.body, new Date(msg.date));
            connection.query(txInsert, [
              tx.date, tx.amount, tx.type, tx.category, tx.description, rawSmsId
            ], err => {
              if (!err) imported.transactions++;
              resolve();
            });
          } else {
            resolve();
          }
        });
      }));

      Promise.all(tasks)
        .then(() => {
          connection.commit(err => {
            connection.release();
            if (err) return res.status(500).json({ error: 'Commit failed' });
            res.json({ message: 'Import successful', imported });
          });
        })
        .catch(error => {
          connection.rollback(() => {
            connection.release();
            res.status(500).json({ error: error.message });
          });
        });
    });
  });
});

// Helpers
function isMobileMoneyMessage(body) {
  const keywords = ['M-PESA', 'Mobile Money', 'transaction', 'received', 'sent', 'payment', 'transfer', 'balance', 'withdraw', 'RWF'];
  return keywords.some(k => body.toLowerCase().includes(k.toLowerCase()));
}

function extractTransactionDetails(body, date) {
  const transaction = {
    date: date.toISOString().split('T')[0],
    amount: 0,
    description: body,
    type: 'unknown',
    category: 'Uncategorized'
  };

  const amtMatch = body.match(/(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\s*RWF/i);
  if (amtMatch) {
    transaction.amount = parseFloat(amtMatch[1].replace(/,/g, ''));
  }

  transaction.category = categorizeMessage(body);
  transaction.type = transaction.category === 'Incoming Money' ? 'incoming' : 'outgoing';

  return transaction;
}

function categorizeMessage(body) {
  if (/received .* RWF/i.test(body)) return 'Incoming Money';
  if (/payment .* to .* \d{4,}/i.test(body)) return 'Payments to Code Holders';
  if (/payment .* to .* [a-z]+/i.test(body)) return 'Transfers to Mobile Numbers';
  if (/bank deposit/i.test(body)) return 'Bank Deposits';
  if (/airtime/i.test(body)) return 'Airtime Bill Payments';
  if (/cash power/i.test(body)) return 'Cash Power Bill Payments';
  if (/initiated by/i.test(body)) return 'Third Party Transactions';
  if (/withdrawal/i.test(body)) return 'Withdrawals from Agents';
  if (/bank transfer/i.test(body)) return 'Bank Transfers';
  if (/bundle/i.test(body)) return 'Bundle Purchases';
  return 'Uncategorized';
}

// Serve frontend fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
