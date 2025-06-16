const pool = require('../config/database');

class DatabaseService {
    async insertTransactionType(typeName, description) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO transaction_types (type_name, description) VALUES (?, ?)',
                [typeName, description]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error inserting transaction type:', error);
            throw error;
        }
    }

    async getTransactionTypeId(typeName) {
        try {
            const [rows] = await pool.execute(
                'SELECT id FROM transaction_types WHERE type_name = ?',
                [typeName]
            );
            if (rows.length > 0) {
                return rows[0].id;
            }
            return null;
        } catch (error) {
            console.error('Error getting transaction type:', error);
            throw error;
        }
    }

    async insertTransaction(transactionData) {
        try {
            const {
                transaction_id,
                type_id,
                amount,
                sender,
                recipient,
                phone_number,
                transaction_date,
                fee,
                balance,
                status,
                raw_message
            } = transactionData;

            const [result] = await pool.execute(
                `INSERT INTO transactions (
                    transaction_id, type_id, amount, sender, recipient,
                    phone_number, transaction_date, fee, balance,
                    status, raw_message
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    transaction_id,
                    type_id,
                    amount,
                    sender,
                    recipient,
                    phone_number,
                    transaction_date,
                    fee,
                    balance,
                    status,
                    raw_message
                ]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error inserting transaction:', error);
            throw error;
        }
    }

    async insertErrorLog(message, rawData) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO error_logs (message, raw_data) VALUES (?, ?)',
                [message, rawData]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error inserting error log:', error);
            throw error;
        }
    }

    async processTransaction(transactionData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Get or create transaction type
            let typeId = await this.getTransactionTypeId(transactionData.type);
            if (!typeId) {
                typeId = await this.insertTransactionType(
                    transactionData.type,
                    `Transaction type for ${transactionData.type}`
                );
            }

            // Insert transaction
            const transactionId = await this.insertTransaction({
                ...transactionData,
                type_id: typeId
            });

            await connection.commit();
            return transactionId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new DatabaseService(); 