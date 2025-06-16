document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const importHistory = document.getElementById('importHistory');

    // Load import history
    loadImportHistory();

    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const fileInput = document.getElementById('xmlFile');
        
        if (!fileInput.files.length) {
            showStatus('Please select a file', 'danger');
            return;
        }

        formData.append('xmlFile', fileInput.files[0]);

        try {
            showStatus('Uploading...', 'info');
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showStatus(`Successfully imported ${result.imported} transactions`, 'success');
                uploadForm.reset();
                loadImportHistory();
            } else {
                showStatus(result.error || 'Upload failed', 'danger');
            }
        } catch (error) {
            showStatus('Error uploading file', 'danger');
            console.error('Upload error:', error);
        }
    });

    async function loadImportHistory() {
        try {
            const response = await fetch('/api/import-history');
            const history = await response.json();

            importHistory.innerHTML = history.map(item => `
                <tr>
                    <td>${item.filename}</td>
                    <td>${new Date(item.import_date).toLocaleString()}</td>
                    <td><span class="badge bg-${item.status === 'success' ? 'success' : 'danger'}">${item.status}</span></td>
                    <td>${item.records_imported}</td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading import history:', error);
        }
    }

    function showStatus(message, type) {
        uploadStatus.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}); 