-- Create import history table
CREATE TABLE IF NOT EXISTS import_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    import_date DATETIME NOT NULL,
    status ENUM('success', 'partial', 'failed') NOT NULL,
    records_imported INT NOT NULL DEFAULT 0,
    failed_records INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create transaction types table if not exists
CREATE TABLE IF NOT EXISTS transaction_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default transaction types
INSERT IGNORE INTO transaction_types (id, type_name, description) VALUES
(1, 'Receive Money', 'Money received from another person'),
(2, 'Send Money', 'Money sent to another person'),
(3, 'Withdrawal', 'Cash withdrawal from agent'),
(4, 'Bundle Purchase', 'Purchase of data or airtime bundle'),
(5, 'Other', 'Other types of transactions');

-- Create transactions table if not exists
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    type_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0,
    sender VARCHAR(255),
    recipient VARCHAR(255),
    phone_number VARCHAR(20),
    transaction_date DATETIME NOT NULL,
    status ENUM('SUCCESS', 'FAILED', 'PENDING') DEFAULT 'SUCCESS',
    raw_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (type_id) REFERENCES transaction_types(id)
); 