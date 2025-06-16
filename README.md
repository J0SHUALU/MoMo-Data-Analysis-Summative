# MTN Mobile Money Transaction Analysis System

A Node.js application for analyzing MTN Mobile Money transactions from SMS backup files. This system helps track and analyze mobile money transactions by processing SMS backup files.

## For Instructors

### System Overview
This application demonstrates:
- XML file processing
- SMS message parsing
- Database operations
- RESTful API implementation
- Frontend development with modern JavaScript
- Error handling and logging
- Data visualization

### Key Learning Points
1. **Backend Development**
   - Node.js and Express.js setup
   - Database design and implementation
   - API endpoint creation
   - File processing and parsing
   - Error handling

2. **Frontend Development**
   - Modern JavaScript (ES6+)
   - Chart.js for data visualization
   - Responsive design
   - AJAX and API integration

3. **Database Concepts**
   - Transaction management
   - Data normalization
   - Error logging
   - Data relationships

## Installation Guide

### Prerequisites
1. Install XAMPP:
   - Download from: https://www.apachefriends.org/
   - Install and start Apache and MySQL services

2. Install Node.js:
   - Download from: https://nodejs.org/
   - Choose LTS version (v14 or higher)

### Setup Steps

1. **Clone and Setup Project**
```bash
# Clone the repository
git clone <repository-url>
cd summative

# Install dependencies
npm install
```

2. **Database Setup**
```bash
# Start MySQL in XAMPP
# Open phpMyAdmin (http://localhost/phpmyadmin)
# Create new database named 'momo_analysis'
# Import db.sql file
```

3. **Configuration**
- Database credentials are pre-configured:
  - Host: localhost
  - User: root
  - Password: (empty)
  - Database: momo_analysis

4. **Start the Application**
```bash
npm start
```

## Using the Application

### 1. Import SMS Backup
1. Open browser and navigate to `http://localhost:3000`
2. Click "Import XML" in the navigation menu
3. Select your SMS backup XML file
4. Click "Upload"
5. Wait for processing to complete
6. View import results

### 2. View Transactions
1. Click "Transactions" in the navigation menu
2. Use filters to:
   - Search by transaction ID
   - Filter by date range
   - Filter by transaction type
   - Sort by any column
3. Click on a transaction to view details

### 3. View Analytics
1. Click "Dashboard" in the navigation menu
2. View:
   - Transaction volume by type
   - Daily transaction trends
   - Transaction amounts distribution
   - Success/failure rates

### 4. Error Handling
1. Check "Error Logs" for any processing issues
2. Common errors and solutions:
   - Invalid XML format: Ensure file is valid XML
   - Database connection: Verify MySQL is running
   - File permissions: Check uploads directory

## Project Structure

```
summative/
├── config/             # Configuration files
│   └── database.js     # Database configuration
├── services/           # Business logic services
│   └── databaseService.js  # Database operations
├── utils/             # Utility functions
│   ├── xmlProcessor.js    # XML file processing
│   └── smsParser.js       # SMS message parsing
├── routes/            # API routes
│   └── api.js         # API endpoints
├── views/             # Frontend views
├── public/            # Static files
│   ├── css/          # Stylesheets
│   └── js/           # Client-side JavaScript
├── uploads/           # Temporary file storage
└── app.js            # Main application file
```

## Testing the Application

### 1. Sample Data
- Use the provided sample XML file in the `data` directory
- File contains various transaction types for testing

### 2. Test Cases
1. **File Upload**
   - Test with valid XML file
   - Test with invalid file format
   - Test with empty file

2. **Transaction Processing**
   - Verify all transaction types are recognized
   - Check amount calculations
   - Verify date parsing

3. **Error Handling**
   - Test with malformed XML
   - Test with invalid transaction data
   - Verify error logging

## Common Issues and Solutions

1. **Database Connection Issues**
   - Verify MySQL is running in XAMPP
   - Check database credentials
   - Ensure database exists

2. **File Upload Issues**
   - Check uploads directory permissions
   - Verify file size limits
   - Check file format

3. **Processing Errors**
   - Check error_logs table
   - Verify XML format
   - Check server logs

## API Documentation

### POST /api/upload
Upload and process XML file
```http
POST /api/upload
Content-Type: multipart/form-data

file: [XML file]
```

### GET /api/transactions
Get filtered transactions
```http
GET /api/transactions?page=1&limit=10&type=SEND&startDate=2024-01-01&endDate=2024-12-31
```

## Database Schema

### transaction_types
```sql
CREATE TABLE `transaction_types` (
  `id` int(11) NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
)
```

### transactions
```sql
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `transaction_id` varchar(50) DEFAULT NULL,
  `type_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `sender` varchar(100) DEFAULT NULL,
  `recipient` varchar(100) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `transaction_date` datetime DEFAULT NULL,
  `fee` decimal(10,2) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `raw_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
)
```

### error_logs
```sql
CREATE TABLE `error_logs` (
  `id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `raw_data` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
)
```

## Support

For technical support or questions:
1. Check the error logs
2. Review the documentation
3. Contact the development team

## License

This project is licensed under the MIT License. 