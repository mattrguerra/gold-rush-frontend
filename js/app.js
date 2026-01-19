// ===============================================
// Gold Rush Admin - Dashboard Logic
// ===============================================

// 1. Navigation Logic
function switchView(viewName, navElement) {
    localStorage.setItem('activeView', viewName);

    // Toggle Sections
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');
    
    // Toggle Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (navElement) {
        navElement.classList.add('active');
    } else {
        // Fallback for page load
        const link = document.querySelector(`.nav-item[onclick*="'${viewName}'"]`);
        if (link) link.classList.add('active');
    }

    // Update Header Title (using t() from translations.js)
    const titleKey = document.querySelector(`.nav-item[onclick*="'${viewName}'"] span[data-i18n]`)?.getAttribute('data-i18n') || 'Panel';
    const headerTitle = document.getElementById('page-header-title');
    if (headerTitle) headerTitle.textContent = t(titleKey);

    // Load Data for this section
    loadSectionData(viewName);
}

// 2. Data Loader
async function loadSectionData(section) {
    if (section === 'dashboard') {
        try {
            // Stats
            const stats = await apiRequest('/admin/stats');
            if (stats) {
                document.getElementById('today-count').textContent = stats.todayCount || 0;
                document.getElementById('pending-count').textContent = stats.pendingCount || 0;
                document.getElementById('week-count').textContent = stats.weekCount || 0;
                document.getElementById('revenue-count').textContent = `$${parseFloat(stats.weekRevenue || 0).toLocaleString()}`;
            }

            // Today's Agenda
            const bookingsData = await apiRequest('/bookings');
            const container = document.getElementById('today-schedule');
            
            if (bookingsData && bookingsData.bookings) {
                const today = new Date().toISOString().split('T')[0];
                const todayList = bookingsData.bookings.filter(b => b.scheduled_date.startsWith(today));
                
                if (todayList.length === 0) {
                    container.innerHTML = `<div style="padding: 25px; color: var(--text-secondary);">${t('No hay citas para hoy')}</div>`;
                } else {
                    container.innerHTML = todayList.map(b => `
                        <div style="padding: 15px 25px; border-bottom: 1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <div style="color:white; font-weight:600;">${b.customer_name}</div>
                                <div style="color:var(--text-secondary); font-size:12px;">${b.service_name}</div>
                            </div>
                            <div style="color:var(--gold); font-weight:600;">${b.scheduled_time}</div>
                        </div>
                    `).join('');
                }
            }
        } catch (e) {
            console.error("Dashboard Load Error:", e);
        }
    }
    
    if (section === 'bookings') {
        const container = document.getElementById('bookings-list');
        container.innerHTML = `<div style="padding:25px;">${t('Cargando...')}</div>`;
        
        const data = await apiRequest('/bookings');
        if (data && data.bookings) {
            if (data.bookings.length === 0) {
                container.innerHTML = `<div style="padding:25px;">No bookings found.</div>`;
                return;
            }
            // Simple Table Render
            container.innerHTML = data.bookings.map(b => `
                <div style="padding: 20px; border-bottom: 1px solid var(--glass-border); display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; align-items: center;">
                    <div>
                        <strong style="color:white; display:block;">${b.customer_name}</strong>
                        <span style="font-size:12px; color:var(--text-secondary);">${b.email}</span>
                    </div>
                    <div style="color:var(--gold);">${b.service_name}</div>
                    <div style="color:white;">${b.scheduled_date.split('T')[0]}</div>
                    <div><span class="status-badge status-${b.status}">${b.status}</span></div>
                </div>
            `).join('');
        }
    }
}

// 3. Init
document.addEventListener('DOMContentLoaded', () => {
    // Restore View
    const savedView = localStorage.getItem('activeView') || 'dashboard';
    switchView(savedView);
});