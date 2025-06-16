# MTN Mobile Money Transaction Analysis System

A comprehensive Node.js application for analyzing MTN Mobile Money transactions from SMS backup files. This system provides detailed insights into mobile money transactions through advanced data processing, visualization, and analysis.

## Project Overview

This project demonstrates the implementation of a full-stack application for processing and analyzing MTN Mobile Money transactions from SMS backup files. The system includes:

- XML file processing and SMS message parsing
- Well-structured database design and implementation
- Interactive frontend dashboard with data visualizations
- RESTful API for backend/frontend integration
- Comprehensive error handling and logging
- Detailed documentation

## Evaluation Criteria

### 1. Data Processing (20 points)
- Accurate parsing of SMS data
- Proper categorization of transactions
- Efficient data cleaning and validation
- Robust error handling for malformed data

### 2. Database Design (20 points)
- Normalized database schema
- Efficient query optimization
- Proper data relationships
- Data integrity constraints
- Transaction management

### 3. Frontend Design (25 points)
- Modern and intuitive user interface
- Interactive data visualizations
- Responsive design principles
- Clear data presentation
- User-friendly navigation

### 4. Code Quality (15 points)
- Clean and modular code structure
- Comprehensive error handling
- Proper code documentation
- Efficient algorithms
- Consistent coding standards

### 5. Documentation (10 points)
- Clear project setup instructions
- Detailed API documentation
- System architecture explanation
- Implementation challenges and solutions
- Future improvement suggestions

### 6. Bonus Features (10 points)
- Advanced data visualizations
- Additional API endpoints
- Enhanced user interactions
- Performance optimizations
- Additional analysis features

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
git clone <https://github.com/J0SHUALU/MoMo-Data-Analysis-Summative.git >
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

## Features

### 1. Data Processing
- XML file parsing and validation
- SMS message extraction and categorization
- Transaction data cleaning and normalization
- Error logging and handling

### 2. Database Operations
- Efficient data storage and retrieval
- Transaction management
- Data integrity maintenance
- Query optimization

### 3. Frontend Dashboard
- Interactive data visualizations
- Real-time data updates
- Filtering and sorting capabilities
- Responsive design

### 4. API Endpoints
- File upload and processing
- Transaction data retrieval
- Analytics data access
- Error logging

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

## Testing

### 1. Unit Tests
- Data processing functions
- Database operations
- API endpoints
- Utility functions

### 2. Integration Tests
- End-to-end workflows
- API integration
- Database operations
- Frontend-backend interaction

### 3. Performance Tests
- Data processing speed
- Query optimization
- Frontend responsiveness
- API response times

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 