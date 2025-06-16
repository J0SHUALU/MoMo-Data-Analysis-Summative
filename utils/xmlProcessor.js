const xml2js = require('xml2js');
const smsParser = require('./smsParser');
const databaseService = require('../services/databaseService');

class XMLProcessor {
    constructor() {
        this.parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });
    }

    async processXML(xmlData) {
        try {
            const result = await this.parser.parseStringPromise(xmlData);
            const messages = this.extractMessages(result);
            const processedResults = {
                success: 0,
                failed: 0,
                errors: []
            };

            for (const message of messages) {
                try {
                    const transactionData = await smsParser.parseMessage(message);
                    if (transactionData) {
                        await databaseService.processTransaction(transactionData);
                        processedResults.success++;
                    }
                } catch (error) {
                    processedResults.failed++;
                    processedResults.errors.push({
                        message: error.message,
                        rawMessage: message
                    });
                    await databaseService.insertErrorLog(
                        error.message,
                        JSON.stringify({ message, error: error.message })
                    );
                }
            }

            return processedResults;
        } catch (error) {
            console.error('Error processing XML:', error);
            await databaseService.insertErrorLog(
                'XML Processing Error',
                JSON.stringify({ xmlData, error: error.message })
            );
            throw error;
        }
    }

    extractMessages(result) {
        try {
            if (!result || !result.smses || !result.smses.sms) {
                return [];
            }

            const messages = Array.isArray(result.smses.sms) 
                ? result.smses.sms 
                : [result.smses.sms];

            return messages.map(sms => ({
                body: sms.body,
                date: sms.date,
                type: sms.type,
                address: sms.address
            }));
        } catch (error) {
            console.error('Error extracting messages:', error);
            throw new Error('Failed to extract messages from XML');
        }
    }
}

module.exports = new XMLProcessor(); 