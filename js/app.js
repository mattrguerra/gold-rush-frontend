// ===============================================
// Gold Rush Admin - SPA Logic
// ===============================================

// 1. Navigation Controller (Fixes Scrolling Issue)
function switchView(viewName, navElement) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
    });

    // Show target view
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.add('active');
    }

    // Update Sidebar State
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    }

    // Update Header Title
    const titles = {
        'dashboard': 'Dashboard',
        'bookings': 'Bookings Manager',
        'services': 'Service Menu',
        'customers': 'Client Database',
        'settings': 'System Settings',
        'availability': 'Calendar Availability'
    };
    document.getElementById('page-header-title').textContent = titles[viewName] || 'Admin';
    
    // Trigger data load for that section
    loadSectionData(viewName);
}

// 2. Data Loader
async function loadSectionData(section) {
    switch(section) {
        case 'dashboard': await loadDashboard(); break;
        case 'bookings': await loadBookings(); break;
        case 'services': await loadServices(); break;
        case 'customers': await loadCustomers(); break;
    }
}

// 3. Improved Language Toggle
function toggleLanguage() {
    const isChecked = document.getElementById('lang-toggle').checked;
    const newLang = isChecked ? 'en' : 'es'; // Toggle logic
    
    localStorage.setItem('lang', newLang);
    location.reload(); // Simple reload to apply all text changes from translations.js
}

// 4. Init
document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    if(typeof checkAuth === 'function') checkAuth();

    // Set Date
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Set Toggle State
    const currentLang = localStorage.getItem('lang') || 'es';
    const toggle = document.getElementById('lang-toggle');
    if(toggle) toggle.checked = (currentLang === 'en');

    // Load Default View
    loadDashboard();
});

// --- Existing logic for Dashboard Data ---
// (Keep your existing API calls here, just ensure they target the new IDs)

async function loadDashboard() {
    try {
        const [stats, bookings] = await Promise.all([
            apiRequest('/admin/stats'),
            apiRequest('/bookings')
        ]);

        if (stats) {
            document.getElementById('today-count').textContent = stats.todayCount;
            document.getElementById('pending-count').textContent = stats.pendingCount;
            document.getElementById('week-count').textContent = stats.weekCount;
            document.getElementById('revenue-count').textContent = `$${stats.weekRevenue}`;
        }
        
        // Render simple list for dashboard widget
        if (bookings && bookings.bookings) {
            const today = new Date().toISOString().split('T')[0];
            const todayList = bookings.bookings.filter(b => b.scheduled_date.startsWith(today));
            
            const html = todayList.length ? todayList.map(b => `
                <div style="padding: 15px 24px; border-bottom: 1px solid var(--glass-border); display:flex; justify-content:space-between;">
                    <div><strong style="color:var(--gold)">${b.customer_name}</strong> - ${b.service_name}</div>
                    <div style="color:var(--text-secondary)">${b.scheduled_time}</div>
                </div>
            `).join('') : '<div style="padding:20px; color:var(--text-secondary)">No bookings for today</div>';
            
            document.getElementById('today-schedule').innerHTML = html;
        }

    } catch (e) {
        console.error(e);
    }
}

// Stub for Modal Close
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}