// Admin Dashboard JavaScript

// Initialize Lucide icons
lucide.createIcons();

// State management
let currentPage = 'dashboard';
let sidebarCollapsed = false;
let users = [
    {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'approved',
        credits: 850,
        requests: 1240,
        joined: '2023-12-15',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'
    },
    {
        id: 2,
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        status: 'pending',
        credits: 0,
        requests: 0,
        joined: '2024-01-20',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b829?w=40&h=40&fit=crop&crop=face'
    },
    {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike@example.com',
        status: 'approved',
        credits: 1200,
        requests: 2100,
        joined: '2023-11-08',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face'
    },
    {
        id: 4,
        name: 'Emily Chen',
        email: 'emily@example.com',
        status: 'rejected',
        credits: 0,
        requests: 15,
        joined: '2024-01-10',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face'
    },
    {
        id: 5,
        name: 'David Brown',
        email: 'david@example.com',
        status: 'approved',
        credits: 500,
        requests: 890,
        joined: '2023-10-22',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face'
    }
];

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const mainContent = document.getElementById('main-content');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const logoutBtn = document.getElementById('logout-btn');
const userSearch = document.getElementById('user-search');
const statusFilter = document.getElementById('status-filter');
const usersTableBody = document.getElementById('users-table-body');
const toastContainer = document.getElementById('toast-container');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts()
    renderUsersTable();
    setupEventListeners();
    
    // Set initial active page
    showPage('dashboard');
    
    // Re-initialize Lucide icons after dynamic content
    lucide.createIcons();
});

// Event Listeners Setup
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            showPage(page);
            setActiveNavLink(link);
        });
    });
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // User search and filter
    userSearch.addEventListener('input', filterUsers);
    statusFilter.addEventListener('change', filterUsers);
    
    // Copy buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const targetId = e.target.dataset.copy;
            copyToClipboard(targetId);
        }
    });
    
    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !sidebarToggle.contains(e.target) &&
            sidebar.classList.contains('mobile-open')) {
            closeMobileSidebar();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

// Sidebar Functions
function toggleSidebar() {
    if (window.innerWidth <= 1024) {
        // Mobile behavior
        sidebar.classList.toggle('mobile-open');
    } else {
        // Desktop behavior
        sidebarCollapsed = !sidebarCollapsed;
        sidebar.classList.toggle('sidebar-collapsed');
        mainContent.classList.toggle('content-expanded');
        
        // Update toggle icon
        const icon = sidebarToggle.querySelector('i');
        icon.setAttribute('data-lucide', sidebarCollapsed ? 'menu' : 'x');
        lucide.createIcons();
    }
}

function closeMobileSidebar() {
    sidebar.classList.remove('mobile-open');
}

// Navigation Functions
function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(`${pageId}-page`).classList.add('active');
    currentPage = pageId;
    
    // Close mobile sidebar when navigating
    if (window.innerWidth <= 1024) {
        closeMobileSidebar();
    }
}

function setActiveNavLink(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

// Charts Initialization
function initializeCharts() {
    // Usage Chart
    const usageCtx = document.getElementById('usageChart').getContext('2d');
    new Chart(usageCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'API Requests',
                data: [120, 190, 150, 250, 220, 300],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgb(156, 163, 175)'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgb(156, 163, 175)'
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    }
                },
                y: {
                    ticks: {
                        color: 'rgb(156, 163, 175)'
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    }
                }
            }
        }
    });
    
    // Moderation Chart
    const moderationCtx = document.getElementById('moderationChart').getContext('2d');
    new Chart(moderationCtx, {
        type: 'doughnut',
        data: {
            labels: ['Clean', 'Toxic', 'Spam', 'Profanity'],
            datasets: [{
                data: [65, 20, 10, 5],
                backgroundColor: [
                    'rgb(34, 197, 94)',
                    'rgb(239, 68, 68)',
                    'rgb(234, 179, 8)',
                    'rgb(147, 51, 234)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'rgb(156, 163, 175)',
                        padding: 20
                    }
                }
            }
        }
    });
}

// Users Management Functions
function renderUsersTable() {
    const tbody = usersTableBody;
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

function createUserRow(user) {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-800 transition-colors';
    
    const statusClass = `status-${user.status}`;
    const statusText = user.status.charAt(0).toUpperCase() + user.status.slice(1);
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
                <img class="h-10 w-10 rounded-full" src="${user.avatar}" alt="${user.name}">
                <div class="ml-4">
                    <div class="text-sm font-medium text-white">${user.name}</div>
                    <div class="text-sm text-gray-400">${user.email}</div>
                </div>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="status-badge ${statusClass}">${statusText}</span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
            ${user.credits.toLocaleString()}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
            ${user.requests.toLocaleString()}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
            ${formatDate(user.joined)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
            ${user.status === 'pending' ? `
                <button class="action-btn btn-approve" onclick="approveUser(${user.id})">Approve</button>
                <button class="action-btn btn-reject" onclick="rejectUser(${user.id})">Reject</button>
            ` : ''}
            <button class="action-btn btn-view" onclick="viewUser(${user.id})">View</button>
            <button class="action-btn btn-delete" onclick="deleteUser(${user.id})">Delete</button>
        </td>
    `;
    
    return row;
}

function filterUsers() {
    const searchTerm = userSearch.value.toLowerCase();
    const statusValue = statusFilter.value;
    
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm) || 
                             user.email.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusValue || user.status === statusValue;
        
        return matchesSearch && matchesStatus;
    });
    
    renderFilteredUsers(filteredUsers);
}

function renderFilteredUsers(filteredUsers) {
    const tbody = usersTableBody;
    tbody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = createUserRow(user);
        tbody.appendChild(row);
    });
}

// User Actions
function approveUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = 'approved';
        user.credits = 1000; // Give initial credits
        renderUsersTable();
        showToast('User approved successfully', 'success');
    }
}

function rejectUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        user.status = 'rejected';
        renderUsersTable();
        showToast('User rejected', 'warning');
    }
}

function viewUser(userId) {
    const user = users.find(u => u.id === userId);
    if (user) {
        showUserModal(user);
    }
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users.splice(index, 1);
            renderUsersTable();
            showToast('User deleted successfully', 'error');
        }
    }
}

// Modal Functions
function showUserModal(user) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-white">User Details</h2>
                <button onclick="closeModal(this)" class="text-gray-400 hover:text-white">
                    <i data-lucide="x" class="w-6 h-6"></i>
                </button>
            </div>
            <div class="space-y-4">
                <div class="flex items-center gap-4">
                    <img src="${user.avatar}" alt="${user.name}" class="w-16 h-16 rounded-full">
                    <div>
                        <h3 class="text-lg font-semibold text-white">${user.name}</h3>
                        <p class="text-gray-400">${user.email}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-sm font-medium text-gray-400">Status</label>
                        <p class="text-white">${user.status}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-400">Credits</label>
                        <p class="text-white">${user.credits.toLocaleString()}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-400">API Requests</label>
                        <p class="text-white">${user.requests.toLocaleString()}</p>
                    </div>
                    <div>
                        <label class="text-sm font-medium text-gray-400">Joined</label>
                        <p class="text-white">${formatDate(user.joined)}</p>
                    </div>
                </div>
                <div class="pt-4 border-t border-gray-700">
                    <h4 class="font-medium text-white mb-2">API Key</h4>
                    <div class="bg-gray-800 p-3 rounded font-mono text-sm text-gray-300">
                        sk-${generateRandomString(48)}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    lucide.createIcons();
}

function closeModal(button) {
    const modal = button.closest('.modal-overlay');
    modal.remove();
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Copied to clipboard!', 'success');
    });
}

// Toast Notification System
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast bg-gray-800 border border-gray-700 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 min-w-80`;
    
    const iconMap = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };
    
    const colorMap = {
        success: 'text-green-400',
        error: 'text-red-400',
        warning: 'text-yellow-400',
        info: 'text-blue-400'
    };
    
    toast.innerHTML = `
        <i data-lucide="${iconMap[type]}" class="w-5 h-5 ${colorMap[type]}"></i>
        <span>${message}</span>
        <button onclick="removeToast(this)" class="ml-auto text-gray-400 hover:text-white">
            <i data-lucide="x" class="w-4 h-4"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeToast(toast.querySelector('button'));
    }, 5000);
}

function removeToast(button) {
    const toast = button.closest('.toast');
    toast.classList.add('removing');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

// Logout Function
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
            // Redirect to login page or clear session
            window.location.href = '/login.html';
        }, 1000);
    }
}

// Settings Functions
function saveSettings() {
    showToast('Settings saved successfully!', 'success');
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        showToast('Settings reset to defaults', 'info');
    }
}

// Global functions for inline event handlers
window.approveUser = approveUser;
window.rejectUser = rejectUser;
window.viewUser = viewUser;
window.deleteUser = deleteUser;
window.closeModal = closeModal;
window.removeToast = removeToast;
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;