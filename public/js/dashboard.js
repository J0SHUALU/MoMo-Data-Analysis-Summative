document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();
    
    // Load initial data
    loadStats();
    loadTransactions();

    // Add event listeners for filters
    document.getElementById('searchInput').addEventListener('input', debounce(() => loadTransactions(1), 300));
    document.getElementById('typeFilter').addEventListener('change', () => loadTransactions(1));
    document.getElementById('dateFilter').addEventListener('change', () => loadTransactions(1));
    document.getElementById('minAmount').addEventListener('input', debounce(() => loadTransactions(1), 300));
    document.getElementById('maxAmount').addEventListener('input', debounce(() => loadTransactions(1), 300));
});

function initializeCharts() {
    // Transaction Types Chart
    const typeCtx = document.getElementById('transactionTypesChart').getContext('2d');
    window.typeChart = new Chart(typeCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FFD700', // MTN Yellow
                    '#FFA500', // Orange
                    '#FF8C00', // Dark Orange
                    '#FFD700', // Yellow
                    '#FFC107'  // Amber
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 10
                    }
                },
                title: {
                    display: true,
                    text: 'Transaction Types Distribution',
                    font: {
                        size: 14
                    }
                }
            }
        }
    });

    // Monthly Volume Chart
    const volumeCtx = document.getElementById('monthlyVolumeChart').getContext('2d');
    window.volumeChart = new Chart(volumeCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Transaction Volume',
                data: [],
                backgroundColor: '#FFD700',
                borderColor: '#FFD700',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Monthly Transaction Volume',
                    font: {
                        size: 14
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString() + ' RWF';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        // Update stats cards
        document.getElementById('totalTransactions').textContent = stats.totalTransactions.toLocaleString();
        document.getElementById('totalVolume').textContent = stats.totalVolume.toLocaleString() + ' RWF';
        document.getElementById('successRate').textContent = stats.successRate + '%';
        document.getElementById('averageAmount').textContent = stats.averageAmount.toLocaleString() + ' RWF';

        // Update charts
        updateCharts(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadTransactions(page = 1) {
    try {
        const searchQuery = document.getElementById('searchInput').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const minAmount = document.getElementById('minAmount').value;
        const maxAmount = document.getElementById('maxAmount').value;

        const queryParams = new URLSearchParams({
            page,
            limit: 10,
            search: searchQuery,
            type: typeFilter,
            date: dateFilter,
            minAmount,
            maxAmount
        });

        const response = await fetch(`/api/transactions?${queryParams}`);
        const data = await response.json();

        // Update transactions table
        const tbody = document.getElementById('transactionsTable');
        tbody.innerHTML = data.transactions.map(transaction => `
            <tr>
                <td>${transaction.transaction_id}</td>
                <td>${transaction.type_name ? transaction.type_name.replace(/_/g, ' ') : 'Unknown'}</td>
                <td>${Number(transaction.amount).toLocaleString()} RWF</td>
                <td>${new Date(transaction.transaction_date).toLocaleString()}</td>
                <td><span class="badge bg-${transaction.status === 'SUCCESS' ? 'success' : 'danger'}">${transaction.status}</span></td>
                <td>
                    <a href="/transaction/${transaction.id}" class="btn btn-sm" style="background-color: #FFD700; color: #000000;">View</a>
                </td>
            </tr>
        `).join('');

        // Update pagination
        updatePagination(data.pagination);
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

function updatePagination(pagination) {
    const paginationElement = document.getElementById('pagination');
    const { currentPage, totalPages } = pagination;

    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `;

    // Show limited page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" data-page="1">1</a>
            </li>
            ${startPage > 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
        `;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }

    if (endPage < totalPages) {
        paginationHTML += `
            ${endPage < totalPages - 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
            <li class="page-item">
                <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
            </li>
        `;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `;

    paginationElement.innerHTML = paginationHTML;

    // Add click event listeners to pagination links
    paginationElement.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage) {
                loadTransactions(page);
            }
        });
    });
}

function updateCharts(stats) {
    // Update transaction types chart
    if (window.typeChart && stats.typeDistribution) {
        window.typeChart.data.labels = stats.typeDistribution.map(t => t.type_name.replace(/_/g, ' '));
        window.typeChart.data.datasets[0].data = stats.typeDistribution.map(t => t.count);
        window.typeChart.update();
    }

    // Update monthly volume chart
    if (window.volumeChart && stats.monthlyVolume) {
        window.volumeChart.data.labels = stats.monthlyVolume.map(v => v.month);
        window.volumeChart.data.datasets[0].data = stats.monthlyVolume.map(v => v.amount);
        window.volumeChart.update();
    }
}

function viewDetails(transactionId) {
    window.location.href = `/transaction/${transactionId}`;
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