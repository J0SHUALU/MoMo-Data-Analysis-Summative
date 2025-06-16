const express = require('express');
const router = express.Router();
const multer = require('multer');
const xml2js = require('xml2js');
const mysql = require('mysql2/promise');
const moment = require('moment');
const path = require('path');
const fs = require('fs').promises;
const xmlProcessor = require('../utils/xmlProcessor');

// Database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'momo_analysis',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'text/xml' && !file.originalname.endsWith('.xml')) {
            return cb(new Error('Only XML files are allowed'));
        }
        cb(null, true);
    }
});

// Helper functions
function extractAmount(text) {
    const match = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*RWF/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function extractDate(sms) {
    // Try to get date from message body
    const bodyMatch = sms.body.match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/);
    if (bodyMatch) {
        return bodyMatch[0];
    }
    
    // If not found, use SMS date attribute
    if (sms.date) {
        const timestamp = parseFloat(sms.date) / 1000;
        return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
    }
    
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

function extractTransactionId(text) {
    const patterns = [
        /(?:TxId:|Transaction Id:|Financial Transaction Id:)\s*(\w+)/,
        /External Transaction Id:\s*(\w+)/
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[1];
        }
    }
    
    return `TX${Date.now()}`;
}

function extractPhoneNumber(text) {
    const patterns = [
        /(?:25|07)\d{8}/,
        /\*+(\d{3})/
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            return match[0];
        }
    }
    
    return null;
}

function determineTransactionType(text) {
    const patterns = {
        'received.*RWF.*from': 1, // RECEIVE_MONEY
        'payment.*(?:code|token|merchant)': 2, // PAYMENT_TO_MERCHANT
        'transferred.*to|payment.*to': 3, // TRANSFER_TO_MOBILE
        'bank.*deposit': 4, // BANK_DEPOSIT
        'airtime': 5, // AIRTIME_PURCHASE
        'cash.*power|electricity': 6, // CASHPOWER_PAYMENT
        'DIRECT PAYMENT|third.*party': 7, // THIRD_PARTY_PAYMENT
        'withdrawn|withdraw': 8, // AGENT_WITHDRAWAL
        'bank.*transfer': 9, // BANK_TRANSFER
        'bundle|pack|internet': 10 // BUNDLE_PURCHASE
    };

    for (const [pattern, typeId] of Object.entries(patterns)) {
        if (new RegExp(pattern, 'i').test(text)) {
            return typeId;
        }
    }
    
    return 1; // Default to RECEIVE_MONEY
}

function extractBalance(text) {
    const match = text.match(/(?:balance|BALANCE):\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*RWF/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

function extractFee(text) {
    const match = text.match(/Fee(?:\s*was)?:\s*(\d+)\s*RWF/);
    return match ? parseFloat(match[1]) : 0;
}

function extractSenderRecipient(text, typeId) {
    const data = {
        sender: '',
        recipient: ''
    };

    if (typeId === 1) { // RECEIVE_MONEY
        const match = text.match(/from\s+([^(]*?)(?:\s*\([^)]*\))?\s+(?:on|at)/);
        if (match) {
            data.sender = match[1].trim();
        }
    } else if (typeId === 2 || typeId === 3) { // PAYMENT_TO_MERCHANT or TRANSFER_TO_MOBILE
        const match = text.match(/to\s+([^(]*?)(?:\s*\d+)?\s+(?:has|at)/);
        if (match) {
            data.recipient = match[1].trim();
        }
    } else if (typeId === 8) { // AGENT_WITHDRAWAL
        const match = text.match(/via agent:\s+([^(]*?)(?:\s*\([^)]*\))?/);
        if (match) {
            data.recipient = match[1].trim();
        }
    }

    return data;
}

// API Routes
router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Read and log the file content for debugging
        const fileContent = await fs.readFile(req.file.path, 'utf8');
        console.log('File content:', fileContent.substring(0, 500)); // Log first 500 chars

        // Process the XML file using the new processor
        const processedResults = await xmlProcessor.processXML(fileContent);
        console.log('Processed results:', processedResults);

        // Log errors from parsing
        for (const error of processedResults.errors) {
            await connection.query(
                'INSERT INTO error_logs (message, raw_data) VALUES (?, ?)',
                [error.message, JSON.stringify(error.rawMessage)]
            );
        }

        await connection.commit();
        
        // Clean up uploaded file
        await fs.unlink(req.file.path);

        res.json({
            message: 'File processed successfully',
            recordsImported: processedResults.success,
            failedRecords: processedResults.failed,
            status: processedResults.failed === 0 ? 'success' : 
                   processedResults.success > 0 ? 'partial' : 'failed',
            errors: processedResults.errors
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error processing file:', error);
        
        // Log the error
        try {
            await connection.query(
                'INSERT INTO error_logs (message, raw_data) VALUES (?, ?)',
                [error.message, error.stack]
            );
        } catch (logError) {
            console.error('Error logging error:', logError);
        }

        res.status(500).json({ 
            error: 'Failed to process file',
            message: error.message
        });
    } finally {
        connection.release();
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT t.*, tt.type_name 
            FROM transactions t
            LEFT JOIN transaction_types tt ON t.type_id = tt.id
            WHERE 1=1
        `;
        const params = [];

        if (req.query.search) {
            query += ` AND (t.transaction_id LIKE ? OR t.phone_number LIKE ? OR t.sender LIKE ? OR t.recipient LIKE ?)`;
            const searchTerm = `%${req.query.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (req.query.type) {
            query += ` AND t.type_id = ?`;
            params.push(req.query.type);
        }

        if (req.query.date) {
            query += ` AND DATE(t.transaction_date) = ?`;
            params.push(req.query.date);
        }

        if (req.query.minAmount) {
            query += ` AND t.amount >= ?`;
            params.push(req.query.minAmount);
        }

        if (req.query.maxAmount) {
            query += ` AND t.amount <= ?`;
            params.push(req.query.maxAmount);
        }

        // Get total count for pagination
        const [countResult] = await pool.query(
            `SELECT COUNT(*) as total FROM (${query}) as filtered`,
            params
        );
        const total = countResult[0].total;

        // Add pagination
        query += ` ORDER BY t.transaction_date DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const [transactions] = await pool.query(query, params);

        res.json({
            transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

router.get('/stats', async (req, res) => {
    try {
        // Get total transactions and amounts
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as totalTransactions,
                COALESCE(SUM(amount), 0) as totalVolume,
                COALESCE(AVG(amount), 0) as averageAmount,
                COALESCE((COUNT(CASE WHEN status = 'SUCCESS' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 0) as successRate
            FROM transactions
        `);

        // Get transaction type distribution
        const [typeDistribution] = await pool.query(`
            SELECT 
                tt.type_name,
                COUNT(*) as count
            FROM transactions t
            JOIN transaction_types tt ON t.type_id = tt.id
            GROUP BY tt.id, tt.type_name
            ORDER BY count DESC
        `);

        // Get monthly volume
        const [monthlyVolume] = await pool.query(`
            SELECT 
                DATE_FORMAT(transaction_date, '%Y-%m') as month,
                COALESCE(SUM(amount), 0) as amount
            FROM transactions
            GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
            ORDER BY month DESC
            LIMIT 12
        `);

        res.json({
            totalTransactions: parseInt(stats[0].totalTransactions) || 0,
            totalVolume: parseFloat(stats[0].totalVolume) || 0,
            averageAmount: parseFloat(stats[0].averageAmount) || 0,
            successRate: Math.round(parseFloat(stats[0].successRate)) || 0,
            typeDistribution,
            monthlyVolume
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

router.get('/transaction/:id', async (req, res) => {
    try {
        const [transactions] = await pool.query(
            'SELECT * FROM transactions WHERE id = ?',
            [req.params.id]
        );

        if (transactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transactions[0]);
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get import history
router.get('/import-history', async (req, res) => {
    try {
        const [imports] = await pool.query(
            'SELECT * FROM import_history ORDER BY import_date DESC'
        );
        res.json(imports);
    } catch (error) {
        console.error('Error fetching import history:', error);
        res.status(500).json({ error: 'Failed to fetch import history' });
    }
});

module.exports = router; 