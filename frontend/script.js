// ==== Constants and Selectors ====
// Using the actual IDs from your HTML
const filterType = document.getElementById('filter-type');
const searchInput = document.getElementById('search-input');
const transactionBody = document.getElementById('transaction-body');
const barChartCanvas = document.getElementById('barChart');
const pieChartCanvas = document.getElementById('pieChart');
const modal = document.getElementById('modal');
const modalDetails = document.getElementById('modal-details');
const themeToggle = document.getElementById('theme-toggle');
const langSelect = document.getElementById('lang-select');
const countrySelect = document.getElementById('country-select');

const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let transactions = [];
let filteredTransactions = [];

// API Base URL - change this if your server runs on a different port
const API_URL = 'http://localhost:5500/api';

// ==== API Functions ====
async function fetchTransactions() {
  try {
    const response = await fetch(`${API_URL}/transactions`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    transactions = data.data;
    renderTable();
    renderCharts();
  } catch (error) {
    console.error('Error fetching transactions:', error);
    showNotification('Error loading transactions. Using local data.', 'error');
    // Fallback to localStorage if API fails
    transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    renderTable();
    renderCharts();
  }
}

async function saveTransaction(transaction) {
  try {
    const response = await fetch(`${API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save transaction');
    }
    
    const result = await response.json();
    showNotification('Transaction saved successfully!', 'success');
    return result;
  } catch (error) {
    console.error('Error saving transaction:', error);
    throw error;
  }
}

async function importSMSMessages(messages) {
  try {
    const response = await fetch(`${API_URL}/import-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to import messages');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error importing messages:', error);
    throw error;
  }
}

// ==== Chart Setup ====
let barChart = null;
let pieChart = null;

function initializeCharts() {
  // Bar Chart
  if (barChartCanvas) {
    barChart = new Chart(barChartCanvas, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Transaction Amount',
          data: [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Monthly Transaction Volume'
          }
        }
      }
    });
  }

  // Pie Chart
  if (pieChartCanvas) {
    pieChart = new Chart(pieChartCanvas, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          label: 'Transaction Types',
          data: [],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
            'rgba(83, 102, 255, 0.8)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'Transaction Distribution by Type'
          }
        }
      }
    });
  }
}

// ==== Table Rendering ====
function renderTable() {
  if (!transactionBody) return;
  
  const filtered = getFilteredTransactions();
  
  transactionBody.innerHTML = '';
  
  if (filtered.length === 0) {
    transactionBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No transactions found</td></tr>';
    return;
  }

  filtered.forEach((tx, index) => {
    const row = document.createElement('tr');
    row.style.cursor = 'pointer';
    row.onclick = () => showTransactionDetails(tx);
    
    // Generate a transaction ID if not present
    const txId = tx.id || `TX${String(index + 1).padStart(4, '0')}`;
    
    // Extract name from description (simple extraction)
    const name = extractNameFromDescription(tx.description);
    
    row.innerHTML = `
      <td>${txId}</td>
      <td><span class="transaction-type ${tx.type}">${getTransactionTypeDisplay(tx.category)}</span></td>
      <td class="amount ${tx.type === 'incoming' ? 'positive' : 'negative'}">${formatCurrency(tx.amount)}</td>
      <td>${formatDate(tx.date)}</td>
      <td>${name}</td>
    `;
    
    transactionBody.appendChild(row);
  });
}

// ==== Filtering ====
function getFilteredTransactions() {
  let filtered = [...transactions];

  // Filter by type
  if (filterType && filterType.value && filterType.value !== 'all') {
    filtered = filtered.filter(tx => {
      switch (filterType.value) {
        case 'incoming':
          return tx.type === 'incoming' || tx.category === 'Incoming Money';
        case 'payment':
          return tx.category.includes('Payment') || tx.category.includes('Transfer');
        case 'withdrawal':
          return tx.category.includes('Withdrawal');
        case 'bundle':
          return tx.category.includes('Bundle') || tx.category.includes('Airtime');
        default:
          return true;
      }
    });
  }

  // Filter by search text
  if (searchInput && searchInput.value.trim()) {
    const searchTerm = searchInput.value.toLowerCase();
    filtered = filtered.filter(tx => 
      tx.description.toLowerCase().includes(searchTerm) ||
      tx.category.toLowerCase().includes(searchTerm) ||
      tx.amount.toString().includes(searchTerm) ||
      extractNameFromDescription(tx.description).toLowerCase().includes(searchTerm)
    );
  }

  filteredTransactions = filtered;
  return filtered;
}

// Add event listeners for filtering
if (filterType) {
  filterType.addEventListener('change', () => {
    renderTable();
    renderCharts();
  });
}

if (searchInput) {
  searchInput.addEventListener('input', debounce(() => {
    renderTable();
    renderCharts();
  }, 300));
}

// ==== Chart Rendering ====
function renderCharts() {
  renderBarChart();
  renderPieChart();
}

function renderBarChart() {
  if (!barChart) return;
  
  const filtered = filteredTransactions.length > 0 ? filteredTransactions : transactions;
  const monthlyTotals = {};
  
  filtered.forEach(tx => {
    const month = tx.date.substring(0, 7); // YYYY-MM format
    monthlyTotals[month] = (monthlyTotals[month] || 0) + Math.abs(tx.amount);
  });
  
  const sortedMonths = Object.keys(monthlyTotals).sort();
  const data = sortedMonths.map(month => monthlyTotals[month]);
  
  barChart.data.labels = sortedMonths.map(month => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  });
  barChart.data.datasets[0].data = data;
  barChart.update();
}

function renderPieChart() {
  if (!pieChart) return;
  
  const filtered = filteredTransactions.length > 0 ? filteredTransactions : transactions;
  const typeTotals = {};
  
  filtered.forEach(tx => {
    const type = getTransactionTypeDisplay(tx.category);
    typeTotals[type] = (typeTotals[type] || 0) + Math.abs(tx.amount);
  });
  
  const labels = Object.keys(typeTotals);
  const data = Object.values(typeTotals);
  
  pieChart.data.labels = labels;
  pieChart.data.datasets[0].data = data;
  pieChart.update();
}

// ==== Modal Functions ====
function showTransactionDetails(transaction) {
  if (!modal || !modalDetails) return;
  
  const name = extractNameFromDescription(transaction.description);
  const txId = transaction.id || `TX${Date.now()}`;
  
  modalDetails.innerHTML = `
    <h3>Transaction Details</h3>
    <div class="detail-grid">
      <div class="detail-item">
        <strong>Transaction ID:</strong>
        <span>${txId}</span>
      </div>
      <div class="detail-item">
        <strong>Date:</strong>
        <span>${formatDate(transaction.date)}</span>
      </div>
      <div class="detail-item">
        <strong>Type:</strong>
        <span class="transaction-type ${transaction.type}">${getTransactionTypeDisplay(transaction.category)}</span>
      </div>
      <div class="detail-item">
        <strong>Amount:</strong>
        <span class="amount ${transaction.type === 'incoming' ? 'positive' : 'negative'}">${formatCurrency(transaction.amount)}</span>
      </div>
      <div class="detail-item">
        <strong>Category:</strong>
        <span>${transaction.category}</span>
      </div>
      <div class="detail-item">
        <strong>Name/Contact:</strong>
        <span>${name}</span>
      </div>
      <div class="detail-item full-width">
        <strong>Description:</strong>
        <span>${transaction.description}</span>
      </div>
    </div>
  `;
  
  modal.style.display = 'block';
}

function closeModal() {
  if (modal) {
    modal.style.display = 'none';
  }
}

// Close modal when clicking outside
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

// ==== Theme Toggle ====
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌓';
  });

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    themeToggle.textContent = '☀️';
  }
}

// ==== XML Import (File drop functionality) ====
function setupFileImport() {
  // Create a hidden file input for XML import
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.xml';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  // Add drag and drop functionality to the body
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
    document.body.style.backgroundColor = '#f0f8ff';
  });

  document.body.addEventListener('dragleave', (e) => {
    e.preventDefault();
    document.body.style.backgroundColor = '';
  });

  document.body.addEventListener('drop', (e) => {
    e.preventDefault();
    document.body.style.backgroundColor = '';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith('.xml')) {
      handleXMLFile(files[0]);
    }
  });

  // Add keyboard shortcut for import (Ctrl+I)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleXMLFile(e.target.files[0]);
    }
  });
}

async function handleXMLFile(file) {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    const xmlString = e.target.result;
    try {
      const importedMessages = parseXmlToMessages(xmlString);
      
      if (importedMessages.length > 0) {
        try {
          const result = await importSMSMessages(importedMessages);
          showNotification(`Successfully imported ${result.imported.transactions} transactions from ${result.imported.raw} messages!`, 'success');
          
          // Refresh data
          await fetchTransactions();
        } catch (apiError) {
          console.error('API Error:', apiError);
          
          // Fallback to client-side processing
          const parsedTransactions = importedMessages.map(msg => 
            extractTransactionDetails(msg.body, new Date(msg.date))
          ).filter(Boolean);
          
          transactions = [...transactions, ...parsedTransactions];
          localStorage.setItem('transactions', JSON.stringify(transactions));
          
          renderTable();
          renderCharts();
          
          showNotification(`Successfully imported ${parsedTransactions.length} transactions (offline mode)!`, 'success');
        }
      } else {
        showNotification('No valid messages found in the XML file', 'warning');
      }
    } catch (err) {
      console.error('Error parsing XML:', err);
      showNotification('Error parsing the XML file. Please ensure it contains valid SMS data.', 'error');
    }
  };
  
  reader.onerror = () => {
    showNotification('Error reading the file', 'error');
  };
  
  reader.readAsText(file);
}

// ==== XML Parsing Functions ====
function parseXmlToMessages(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  const smsNodes = xmlDoc.getElementsByTagName('sms');
  
  const messages = [];
  
  for (let i = 0; i < smsNodes.length; i++) {
    const sms = smsNodes[i];
    const body = sms.getAttribute('body');
    const dateMs = parseInt(sms.getAttribute('date'));
    const address = sms.getAttribute('address');
    
    messages.push({
      body,
      date: new Date(dateMs).toISOString(),
      address
    });
  }
  
  return messages;
}

function extractTransactionDetails(body, date) {
  const transaction = {
    date: date.toISOString().split('T')[0],
    amount: 0,
    description: body,
    type: 'unknown',
    category: 'Uncategorized'
  };

  // Extract amount
  const amtMatch = body.match(/(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d+)?\s*RWF/i);
  if (amtMatch) {
    transaction.amount = parseFloat(amtMatch[1].replace(/,/g, ''));
  }

  // Categorize and set type
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

// ==== Utility Functions ====
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0
  }).format(amount);
}

function getTransactionTypeDisplay(category) {
  const typeMap = {
    'Incoming Money': 'Incoming',
    'Payments to Code Holders': 'Payment',
    'Transfers to Mobile Numbers': 'Transfer',
    'Bank Deposits': 'Deposit',
    'Airtime Bill Payments': 'Airtime',
    'Cash Power Bill Payments': 'Cash Power',
    'Third Party Transactions': 'Third Party',
    'Withdrawals from Agents': 'Withdrawal',
    'Bank Transfers': 'Bank Transfer',
    'Bundle Purchases': 'Bundle',
    'Uncategorized': 'Other'
  };
  
  return typeMap[category] || category;
}

function extractNameFromDescription(description) {
  // Try to extract names from common mobile money message patterns
  let name = 'Unknown';
  
  // Pattern: "You have received 1000 RWF from John Doe"
  let match = description.match(/from\s+([A-Za-z\s]+?)(?:\s+\d|$)/i);
  if (match) {
    name = match[1].trim();
  }
  
  // Pattern: "You sent 1000 RWF to Jane Smith"
  if (name === 'Unknown') {
    match = description.match(/to\s+([A-Za-z\s]+?)(?:\s+\d|$)/i);
    if (match) {
      name = match[1].trim();
    }
  }
  
  // Pattern: "Payment to John via 078..."
  if (name === 'Unknown') {
    match = description.match(/Payment\s+to\s+([A-Za-z\s]+?)\s+via/i);
    if (match) {
      name = match[1].trim();
    }
  }
  
  return name || 'Unknown';
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.getElementById('notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      transition: opacity 0.3s ease;
      max-width: 300px;
    `;
    document.body.appendChild(notification);
  }

  // Set colors based on type
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };

  notification.style.backgroundColor = colors[type] || colors.info;
  notification.textContent = message;
  notification.style.opacity = '1';

  // Auto hide after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
  }, 5000);
}

// ==== Initialize Application ====
document.addEventListener('DOMContentLoaded', () => {
  initializeCharts();
  setupFileImport();
  fetchTransactions();
  
  // Show import instructions
  showNotification('Drag & drop XML files or press Ctrl+I to import SMS data', 'info');
});

// Auto-refresh data every 5 minutes
setInterval(fetchTransactions, 5 * 60 * 1000);

// ==== Additional CSS for better styling ====
const additionalCSS = `
  .transaction-type {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .transaction-type.incoming {
    background-color: #d4edda;
    color: #155724;
  }
  
  .transaction-type.outgoing {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .amount.positive {
    color: #28a745;
    font-weight: bold;
  }
  
  .amount.negative {
    color: #dc3545;
    font-weight: bold;
  }
  
  .modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
  }
  
  .modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: none;
    border-radius: 8px;
    width: 80%;
    max-width: 500px;
    position: relative;
  }
  
  .close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    position: absolute;
    right: 15px;
    top: 10px;
  }
  
  .close:hover {
    color: black;
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin-top: 20px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .detail-item.full-width {
    grid-column: 1 / -1;
  }
  
  .detail-item strong {
    color: #666;
    font-size: 14px;
  }
  
  .detail-item span {
    font-size: 16px;
  }
  
  .dark-theme {
    background-color: #1a1a1a;
    color: #e0e0e0;
  }
  
  .dark-theme .modal-content {
    background-color: #2d2d2d;
    color: #e0e0e0;
  }
  
  .dark-theme .close {
    color: #ccc;
  }
  
  .dark-theme .close:hover {
    color: white;
  }
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);