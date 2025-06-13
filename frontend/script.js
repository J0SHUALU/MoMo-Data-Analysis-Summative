// Sample data for testing (replace with API/backend call)
const transactions = [
    { txid: '123456', type: 'incoming', amount: 5000, date: '2024-01-01', name: 'Joshua Moses' },
    { txid: '789012', type: 'payment', amount: 1500, date: '2024-01-02', name: 'Owen Ganza' },
    { txid: '345678', type: 'bundle', amount: 3000, date: '2024-01-03', name: 'Airtime' },
    { txid: '456789', type: 'withdrawal', amount: 20000, date: '2024-01-04', name: 'Olive Umurerwa' },
    { txid: '567890', type: 'bundle', amount: 2000, date: '2024-01-05', name: 'Internet' }
  ];
  
  // Inject transactions into the table
  function renderTable(data) {
    const tbody = document.getElementById('transaction-body');
    tbody.innerHTML = '';
    data.forEach(tx => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${tx.txid}</td>
        <td>${tx.type}</td>
        <td>${tx.amount} RWF</td>
        <td>${tx.date}</td>
        <td>${tx.name}</td>
      `;
      row.onclick = () => openModal(tx);
      tbody.appendChild(row);
    });
  }
  
  // Filter and Search functionality
  document.getElementById('filter-type').addEventListener('change', updateTable);
  document.getElementById('search-input').addEventListener('input', updateTable);
  
  function updateTable() {
    const type = document.getElementById('filter-type').value;
    const query = document.getElementById('search-input').value.toLowerCase();
  
    const filtered = transactions.filter(tx =>
      (type === 'all' || tx.type === type) &&
      (tx.txid.includes(query) || tx.name.toLowerCase().includes(query) || tx.amount.toString().includes(query))
    );
    renderTable(filtered);
  }
  
  // Modal open and close
  function openModal(tx) {
    document.getElementById('modal-details').innerHTML = `
      <h2>Transaction Details</h2>
      <p><strong>TxID:</strong> ${tx.txid}</p>
      <p><strong>Type:</strong> ${tx.type}</p>
      <p><strong>Amount:</strong> ${tx.amount} RWF</p>
      <p><strong>Date:</strong> ${tx.date}</p>
      <p><strong>Name:</strong> ${tx.name}</p>
    `;
    document.getElementById('modal').style.display = 'flex';
  }
  
  function closeModal() {
    document.getElementById('modal').style.display = 'none';
  }
  
  // Chart visualizations using Chart.js
  function generateCharts() {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxPie = document.getElementById('pieChart').getContext('2d');
  
    const typeCounts = transactions.reduce((acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    }, {});
  
    new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: Object.keys(typeCounts),
        datasets: [{
          label: 'Transactions by Type',
          data: Object.values(typeCounts),
          backgroundColor: ['#ffcd56', '#36a2eb', '#ff6384', '#4bc0c0'],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        }
      }
    });
   
    