document.addEventListener('DOMContentLoaded', function() {
    // Mobile sidebar toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
    
    // Navigation and Section Switching
    const links = document.querySelectorAll('.sidebar-link, .mobile-nav-item');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.getElementById('page-title');
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');

    // Handle initial page load
    const initialHash = window.location.hash || '#dashboard';
    updateActiveState(initialHash);

    links.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.id === 'document-open' || this.id === 'mobile-docs') return;
            e.preventDefault();
            
            // Close mobile sidebar if open
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            
            const targetId = this.getAttribute('href');
            window.location.hash = targetId;
        });
    });

    window.addEventListener('hashchange', () => {
        updateActiveState(window.location.hash);
    });

    function updateActiveState(targetId) {
        let found = false;
        
        // Update desktop sidebar
        links.forEach(link => {
            if (link.getAttribute('href') === targetId) {
                link.classList.add('active');
                if (link.classList.contains('sidebar-link')) {
                    pageTitle.textContent = link.textContent.trim();
                }
                found = true;
            } else {
                link.classList.remove('active');
            }
        });
        
        // Update mobile bottom nav
        mobileNavItems.forEach(item => {
            if (item.getAttribute('href') === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        sections.forEach(section => {
            if ('#' + section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Default to dashboard if hash is invalid
        if (!found) {
            document.querySelector('.sidebar-link[href="#dashboard"]').classList.add('active');
            document.querySelector('.mobile-nav-item[href="#dashboard"]').classList.add('active');
            document.getElementById('dashboard').classList.add('active');
            pageTitle.textContent = "Dashboard";
        }
    }

    // Chart Initialization
    const chartDataFromBackend = window.chartDataFromBackend;

    
    const ctx = document.getElementById('usageChart').getContext('2d');

    window.usageChart = null;

    if (ctx) {
        const initialValues = (chartDataFromBackend && chartDataFromBackend.values) ? chartDataFromBackend.values : [0,0,0,0,0,0,0];
        window.usageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'API Calls',
                    data: initialValues,
                    backgroundColor: 'rgba(56, 189, 248, 0.5)',
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    barThickness: 'flex'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false } 
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { 
                            color: 'rgba(56, 189, 248, 0.1)',
                            drawBorder: false
                        },
                        ticks: { 
                            color: '#94a3b8',
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { 
                            color: '#94a3b8',
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    // Fetch usage stats
    (function() {
        const creditsEl = document.getElementById('credits-remaining');
        const totalEl = document.getElementById('total-analyzed');

        async function fetchUsageStats() {
            try {
                const res = await fetch('/api/usage-stats', { cache: 'no-store' });
                if (!res.ok) {
                    if (res.status === 401) {
                        console.warn('Not authorized for usage-stats (maybe logged out).');
                    }
                    return;
                }
                const data = await res.json();

                if (data.credits_remaining !== undefined && creditsEl) {
                    creditsEl.textContent = data.credits_remaining;
                }
                if (data.total_analyzed !== undefined && totalEl) {
                    totalEl.textContent = data.total_analyzed;
                }

                if (data.chart_data && window.usageChart && Array.isArray(data.chart_data.values)) {
                    window.usageChart.data.datasets[0].data = data.chart_data.values;
                    window.usageChart.update();
                }
            } catch (err) {
                console.error('fetchUsageStats error:', err);
            }
        }

        fetchUsageStats();
    })();

    // Documentation button
    const docButton = document.getElementById('document-open');
    const mobileDocButton = document.getElementById('mobile-docs');
    
    if (docButton) {
        docButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(this.href, '_blank');
        });
    }
    
    if (mobileDocButton) {
        mobileDocButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.open(this.href, '_blank');
        });
    }

    // API Keys Functionality
    const generateBtn = document.getElementById('generate-key-btn');
    const keyList = document.getElementById('api-keys-list');

    // Event delegation for copy and delete buttons
    if (keyList) {
        keyList.addEventListener('click', function(event) {
            const target = event.target;
            const copyBtn = target.closest('.copy-key-btn');
            const deleteBtn = target.closest('.delete-key-btn');

            if (copyBtn) {
                handleCopyKey(copyBtn);
            }

            if (deleteBtn) {
                handleDeleteKey(deleteBtn);
            }
        });
    }

    // Generate new API key
    if (generateBtn) {
        generateBtn.addEventListener('click', async function() {
            const btnText = document.getElementById('generate-key-btn-text');
            const originalText = btnText.textContent;
            btnText.textContent = 'Generating...';
            generateBtn.disabled = true;

            try {
                const response = await fetch('/api/generate-key', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to generate key');
                }

                if (data.success) {
                    addKeyToDOM(data.api_key, data.created_at);

                    const successMsg = document.createElement('div');
                    successMsg.className = 'bg-green-500/20 text-green-300 p-3 rounded-lg mb-4';
                    successMsg.innerHTML = `
                        <i class="fas fa-check-circle mr-2"></i>
                        ${data.message || 'API key generated successfully!'}
                    `;
                    keyList.prepend(successMsg);

                    setTimeout(() => successMsg.remove(), 5000);
                } else {
                    throw new Error(data.message || 'Key generation failed');
                }
            } catch (error) {
                console.error('Key generation error:', error);

                const errorMsg = document.createElement('div');
                errorMsg.className = 'bg-red-500/20 text-red-300 p-3 rounded-lg mb-4';
                errorMsg.innerHTML = `
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    ${error.message || 'Failed to generate API key'}
                `;
                keyList.prepend(errorMsg);

                setTimeout(() => errorMsg.remove(), 5000);
            } finally {
                btnText.textContent = originalText;
                generateBtn.disabled = false;
            }
        });
    }

    // Function to add new key to DOM
    function addKeyToDOM(apiKey, createdAt) {
        const noKeysMessage = document.getElementById('no-keys-message');
        if (noKeysMessage) noKeysMessage.remove();

        const keyCard = document.createElement('div');
        keyCard.className = 'api-key-card bg-slate-800/50 p-4 rounded-lg border border-slate-700';
        keyCard.dataset.key = apiKey;
        keyCard.innerHTML = `
            <p class="text-sm text-slate-400">Created on ${createdAt}</p>
            <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center mt-2 space-y-3 lg:space-y-0">
                <p class="api-key-value font-mono text-sky-400 break-all">${apiKey}</p>
                <div class="flex space-x-2">
                    <button class="copy-key-btn bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center">
                        <i class="fas fa-copy mr-1 lg:mr-2"></i>
                        <span class="hidden lg:inline">Copy</span>
                    </button>
                    <button class="delete-key-btn bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        if (keyList) {
            keyList.prepend(keyCard);
        }
    }

    // Handle copy key functionality
    function handleCopyKey(button) {
        const keyCard = button.closest('.api-key-card');
        if (!keyCard) return;

        const apiKey = keyCard.dataset.key;
        if (!apiKey) return;

        navigator.clipboard.writeText(apiKey).then(() => {
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check mr-1 lg:mr-2"></i><span class="hidden lg:inline">Copied!</span>';
            button.classList.add('bg-green-500', 'hover:bg-green-600');

            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('bg-green-500', 'hover:bg-green-600');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy API key');
        });
    }

    // Handle delete key functionality
    function handleDeleteKey(button) {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return;
        }

        const keyCard = button.closest('.api-key-card');
        if (!keyCard) return;

        const apiKey = keyCard.dataset.key;
        if (!apiKey) return;

        keyCard.classList.add('opacity-0', 'transition-opacity', 'duration-300');

        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>';
        button.disabled = true;

        fetch('/api/delete-key', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ key: apiKey })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Delete failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                setTimeout(() => {
                    keyCard.remove();

                    if (keyList && keyList.querySelectorAll('.api-key-card').length === 0) {
                        keyList.innerHTML = '<p id="no-keys-message" class="text-slate-400 text-center py-8">You don\'t have any API keys yet. Generate one to get started!</p>';
                    }
                }, 300);
            } else {
                throw new Error(data.error || 'Delete failed');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            keyCard.classList.remove('opacity-0');
            button.innerHTML = originalContent;
            button.disabled = false;
            alert('Failed to delete key: ' + error.message);
        });
    }
});