class SMSParser {
    parseMessage(message) {
        try {
            const messageText = message.body || message;
            if (!messageText) {
                throw new Error('Empty message content');
            }

            const transactionData = this.extractTransactionDetails(messageText);
            if (!transactionData) {
                throw new Error('Could not extract transaction details');
            }

            return {
                transaction_id: transactionData.transaction_id,
                type: transactionData.type,
                amount: transactionData.amount,
                fee: transactionData.fee || 0,
                balance: transactionData.balance || null,
                sender: transactionData.sender,
                recipient: transactionData.recipient,
                phone_number: transactionData.phone_number,
                transaction_date: transactionData.transaction_date || new Date(message.date),
                status: transactionData.status || 'SUCCESS',
                raw_message: messageText
            };
        } catch (error) {
            console.error('Error parsing message:', error);
            throw error;
        }
    }

    extractTransactionDetails(message) {
        try {
            // Extract transaction ID
            const transactionIdMatch = message.match(/ID:\s*([A-Z0-9]+)/i);
            const transactionId = transactionIdMatch ? transactionIdMatch[1] : null;

            // Extract amount
            const amountMatch = message.match(/GHS\s*([\d,.]+)/i);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

            // Extract fee
            const feeMatch = message.match(/Fee:\s*GHS\s*([\d,.]+)/i);
            const fee = feeMatch ? parseFloat(feeMatch[1].replace(/,/g, '')) : 0;

            // Extract balance
            const balanceMatch = message.match(/Balance:\s*GHS\s*([\d,.]+)/i);
            const balance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null;

            // Determine transaction type
            let type = 'UNKNOWN';
            if (message.toLowerCase().includes('sent to')) {
                type = 'SEND';
            } else if (message.toLowerCase().includes('received from')) {
                type = 'RECEIVE';
            } else if (message.toLowerCase().includes('cash out')) {
                type = 'CASH_OUT';
            } else if (message.toLowerCase().includes('cash in')) {
                type = 'CASH_IN';
            }

            // Extract sender/recipient
            const senderMatch = message.match(/from\s+([A-Za-z0-9\s]+)/i);
            const recipientMatch = message.match(/to\s+([A-Za-z0-9\s]+)/i);
            const sender = senderMatch ? senderMatch[1].trim() : null;
            const recipient = recipientMatch ? recipientMatch[1].trim() : null;

            // Extract phone number
            const phoneMatch = message.match(/(\d{10})/);
            const phoneNumber = phoneMatch ? phoneMatch[1] : null;

            // Extract date
            const dateMatch = message.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/);
            const transactionDate = dateMatch ? new Date(dateMatch[1]) : null;

            // Determine status
            const status = message.toLowerCase().includes('successful') ? 'SUCCESS' : 'FAILED';

            return {
                transaction_id: transactionId,
                type,
                amount,
                fee,
                balance,
                sender,
                recipient,
                phone_number: phoneNumber,
                transaction_date: transactionDate,
                status
            };
        } catch (error) {
            console.error('Error extracting transaction details:', error);
            throw error;
        }
    }
}

module.exports = new SMSParser(); 