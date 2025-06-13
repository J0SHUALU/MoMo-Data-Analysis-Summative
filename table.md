CREATE TABLE raw_sms_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  body TEXT,
  date DATETIME,
  address VARCHAR(255),
  processed TINYINT DEFAULT 0
);

CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE,
  amount DECIMAL(10, 2),
  type VARCHAR(20),
  category VARCHAR(100),
  description TEXT,
  raw_sms_id INT,
  FOREIGN KEY (raw_sms_id) REFERENCES raw_sms_messages(id)
);

