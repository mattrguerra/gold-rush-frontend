// ===============================================
// Gold Rush Admin - Core Logic
// ===============================================

// 1. Translations (Issue 5)
const translations = {
    es: {
        'Panel': 'Panel',
        'Reservas': 'Reservas',
        'Servicios': 'Servicios',
        'Clientes': 'Clientes',
        'Disponibilidad': 'Disponibilidad',
        'Configuración': 'Configuración',
        'Citas de Hoy': 'Citas de Hoy',
        'Pendientes': 'Pendientes',
        'Esta Semana': 'Esta Semana',
        'Ingresos': 'Ingresos',
        'Agenda de Hoy': 'Agenda de Hoy',
        'Cerrar Sesión': 'Cerrar Sesión',
        'Todas': 'Todas',
        'Cargando...': 'Cargando...',
        'No hay citas para hoy': 'No hay citas para hoy',
        'Información del Negocio': 'Información del Negocio'
    },
    en: {
        'Panel': 'Dashboard',
        'Reservas': 'Bookings',
        'Servicios': 'Services',
        'Clientes': 'Clients',
        'Disponibilidad': 'Availability',
        'Configuración': 'Settings',
        'Citas de Hoy': "Today's Jobs",
        'Pendientes': 'Pending',
        'Esta Semana': 'This Week',
        'Ingresos': 'Revenue',
        'Agenda de Hoy': "Today's Agenda",
        'Cerrar Sesión': 'Log Out',
        'Todas': 'All',
        'Cargando...': 'Loading...',
        'No hay citas para hoy': 'No bookings for today',
        'Información del Negocio': 'Business Info'
    }
};

// 2. Navigation & State Management (Issue 4 Fix)
function switchView(viewName, navElement) {
    // Save state so we don't "jump" on reload
    localStorage.setItem('activeView', viewName);

    // Update UI
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');
    
    // Update Sidebar
    if (navElement) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        navElement.classList.add('active');
    } else {
        // If navElement wasn't passed (page load), find it
        const sidebarLink = document.querySelector(`.nav-item[onclick*="'${viewName}'"]`);
        if (sidebarLink) {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            sidebarLink.classList.add('active');
        }
    }

    // Update Header Text based on current language
    const currentLang = localStorage.getItem('lang') || 'es';
    const key = document.querySelector(`.nav-item[onclick*="'${viewName}'"] span[data-i18n]`)?.getAttribute('data-i18n') || 'Panel';
    document.getElementById('page-header-title').textContent = translations[currentLang][key] || key;

    // Load Data
    loadSectionData(viewName);
}

// 3. Language Toggle (Issue 4 & 5 Fix)
function toggleLanguage() {
    const isChecked = document.getElementById('lang-toggle').checked;
    const newLang = isChecked ? 'en' : 'es';
    localStorage.setItem('lang', newLang);
    
    // Apply immediately without full reload if possible, but reload ensures cleanest state
    location.reload(); 
}

function applyTranslations() {
    const lang = localStorage.getItem('lang') || 'es';
    
    // Update Toggle State
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.checked = (lang === 'en');

    // Translate all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });

    // Date Format
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateLocale = lang === 'en' ? 'en-US' : 'es-ES';
    document.getElementById('current-date').textContent = new Date().toLocaleDateString(dateLocale, dateOptions);
}

// 4. Data Loading (Issue 3 Fix)
async function loadSectionData(section) {
    if (section === 'dashboard') {
        try {
            // Fetch stats from your backend
            // Using your existing apiRequest function from auth.js
            const stats = await apiRequest('/admin/stats'); 
            
            if (stats) {
                document.getElementById('today-count').textContent = stats.todayCount || 0;
                document.getElementById('pending-count').textContent = stats.pendingCount || 0;
                document.getElementById('week-count').textContent = stats.weekCount || 0;
                // Format Currency
                const rev = stats.weekRevenue || 0;
                document.getElementById('revenue-count').textContent = `$${parseFloat(rev).toLocaleString()}`;
            }

            // Fetch Today's Schedule
            const bookingsData = await apiRequest('/bookings');
            if (bookingsData && bookingsData.bookings) {
                const today = new Date().toISOString().split('T')[0];
                const todayList = bookingsData.bookings.filter(b => b.scheduled_date.startsWith(today));
                
                const container = document.getElementById('today-schedule');
                if (todayList.length === 0) {
                    const lang = localStorage.getItem('lang') || 'es';
                    container.innerHTML = `<div style="padding: 25px; color: var(--text-secondary);">${translations[lang]['No hay citas para hoy']}</div>`;
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
    // Add other cases (bookings, etc.) here...
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

// 5. Init
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    if (typeof checkAuth === 'function') checkAuth();

    // 2. Restore Active Tab (Fixes "Mystery Toggle Jump")
    const savedView = localStorage.getItem('activeView') || 'dashboard';
    
    // 3. Apply Translations
    applyTranslations();

    // 4. Switch to saved view
    switchView(savedView);
});