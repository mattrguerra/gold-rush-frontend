/**
 * GOLD RUSH ADMINISTRATIVE SYSTEM
 * v4.0 - "Onyx" Engine
 */

// ==========================================
// 1. CONFIGURATION & STATE
// ==========================================
const API_BASE = 'https://gold-rush-backend-production.up.railway.app/api';

const STATE = {
    view: 'dashboard',
    lang: localStorage.getItem('lang') || 'es',
    token: localStorage.getItem('token'),
    data: {
        stats: null,
        bookings: [],
        services: [],
        customers: []
    }
};

// ==========================================
// 2. TRANSLATION DICTIONARY (Expanded)
// ==========================================
const I18N = {
    es: {
        nav_dashboard: "Panel",
        nav_bookings: "Reservas",
        nav_services: "Servicios",
        nav_clients: "Clientes",
        nav_availability: "Disponibilidad",
        nav_settings: "Configuración",
        nav_logout: "Cerrar Sesión",
        
        stat_today: "Citas de Hoy",
        stat_pending: "Pendientes",
        stat_week: "Esta Semana",
        stat_revenue: "Ingresos",
        
        header_dashboard: "Panel de Control",
        header_bookings: "Gestión de Reservas",
        header_services: "Menú de Servicios",
        header_clients: "Base de Datos",
        
        lbl_today_agenda: "Agenda del Día",
        lbl_loading: "Cargando datos...",
        lbl_no_bookings: "No hay citas programadas para hoy.",
        lbl_actions: "Acciones",
        lbl_status: "Estado",
        lbl_customer: "Cliente",
        lbl_service: "Servicio",
        lbl_date: "Fecha",
        
        btn_all: "Todas",
        btn_pending: "Pendientes",
        btn_add: "Agregar Nuevo",
        
        status_pending: "Pendiente",
        status_confirmed: "Confirmada",
        status_completed: "Completada",
        status_cancelled: "Cancelada"
    },
    en: {
        nav_dashboard: "Dashboard",
        nav_bookings: "Bookings",
        nav_services: "Services",
        nav_clients: "Clients",
        nav_availability: "Availability",
        nav_settings: "Settings",
        nav_logout: "Log Out",
        
        stat_today: "Today's Jobs",
        stat_pending: "Pending Actions",
        stat_week: "This Week",
        stat_revenue: "Revenue",
        
        header_dashboard: "Executive Dashboard",
        header_bookings: "Booking Manager",
        header_services: "Service Menu",
        header_clients: "Client Database",
        
        lbl_today_agenda: "Today's Agenda",
        lbl_loading: "Loading data...",
        lbl_no_bookings: "No bookings scheduled for today.",
        lbl_actions: "Actions",
        lbl_status: "Status",
        lbl_customer: "Customer",
        lbl_service: "Service",
        lbl_date: "Date",
        
        btn_all: "All",
        btn_pending: "Pending",
        btn_add: "Add New",
        
        status_pending: "Pending",
        status_confirmed: "Confirmed",
        status_completed: "Completed",
        status_cancelled: "Cancelled"
    }
};

// ==========================================
// 3. CORE FUNCTIONS
// ==========================================

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    checkSecurity();
    initUI();
    renderAll(); // Initial Render
});

function checkSecurity() {
    if (!STATE.token) {
        window.location.href = 'login.html';
    }
}

function initUI() {
    // Set Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const view = el.getAttribute('href').replace('#', '');
            navigate(view);
        });
    });

    // Language Toggle Listener
    const toggle = document.getElementById('lang-toggle');
    if(toggle) {
        toggle.checked = (STATE.lang === 'en');
        toggle.addEventListener('change', (e) => {
            setLanguage(e.target.checked ? 'en' : 'es');
        });
    }

    // Load Data immediately
    refreshData();
}

// --- Navigation & Routing ---
function navigate(viewName) {
    STATE.view = viewName;
    
    // Update Sidebar Visuals
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-item[href="#${viewName}"]`);
    if(activeLink) activeLink.classList.add('active');

    // Show/Hide Sections
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById(`view-${viewName}`);
    if(target) {
        target.style.display = 'block';
        target.classList.add('fade-in');
    }

    renderAll();
}

// --- Language Engine (Instant) ---
function setLanguage(langCode) {
    STATE.lang = langCode;
    localStorage.setItem('lang', langCode);
    renderAll(); // Re-render text immediately without reload
}

function t(key) {
    return I18N[STATE.lang][key] || key; // Fallback to key if missing
}

// --- Data Engine ---
async function refreshData() {
    try {
        console.log('Fetching data...');
        
        // Parallel Fetch for Speed
        const [statsRes, bookingsRes] = await Promise.all([
            fetchAPI('/admin/stats'),
            fetchAPI('/bookings')
        ]);

        STATE.data.stats = statsRes;
        STATE.data.bookings = bookingsRes.bookings || [];
        
        console.log('Data Loaded:', STATE.data);
        renderAll();

    } catch (error) {
        console.error("Data Load Failed", error);
        if(error.status === 401) logout();
    }
}

async function fetchAPI(endpoint) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${STATE.token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!res.ok) throw { status: res.status, msg: res.statusText };
    return await res.json();
}

// ==========================================
// 4. RENDERING (The Visuals)
// ==========================================
function renderAll() {
    renderText();
    renderDashboard();
    renderBookings();
}

function renderText() {
    // Finds every element with data-i18n and updates it
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update Date
    const dateOpts = { weekday: 'long', month: 'long', day: 'numeric' };
    const locale = STATE.lang === 'en' ? 'en-US' : 'es-ES';
    const dateEl = document.getElementById('current-date');
    if(dateEl) dateEl.textContent = new Date().toLocaleDateString(locale, dateOpts);
}

function renderDashboard() {
    if (STATE.view !== 'dashboard') return;

    // Stats
    if (STATE.data.stats) {
        document.getElementById('val-today').textContent = STATE.data.stats.todayCount || 0;
        document.getElementById('val-pending').textContent = STATE.data.stats.pendingCount || 0;
        document.getElementById('val-week').textContent = STATE.data.stats.weekCount || 0;
        document.getElementById('val-revenue').textContent = `$${STATE.data.stats.weekRevenue || 0}`;
    }

    // Today's Agenda
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysBookings = STATE.data.bookings.filter(b => b.scheduled_date.startsWith(todayStr));
    const container = document.getElementById('today-list');
    
    if (todaysBookings.length === 0) {
        container.innerHTML = `<div class="empty-state">${t('lbl_no_bookings')}</div>`;
    } else {
        container.innerHTML = todaysBookings.map(b => `
            <div class="list-item">
                <div class="list-info">
                    <span class="list-title">${b.customer_name}</span>
                    <span class="list-sub">${b.service_name}</span>
                </div>
                <div class="list-meta">
                    <span class="list-time">${b.scheduled_time}</span>
                    <span class="status-dot status-${b.status}"></span>
                </div>
            </div>
        `).join('');
    }
}

function renderBookings() {
    if (STATE.view !== 'bookings') return;

    const list = document.getElementById('bookings-table-body');
    if (!STATE.data.bookings.length) {
        list.innerHTML = `<tr><td colspan="5" class="empty-state">${t('lbl_loading')}</td></tr>`;
        return;
    }

    list.innerHTML = STATE.data.bookings.map(b => `
        <tr onclick="openBooking(${b.id})">
            <td>
                <div class="cell-primary">${b.customer_name}</div>
                <div class="cell-secondary">${b.email}</div>
            </td>
            <td>${b.service_name}</td>
            <td>${b.scheduled_date.split('T')[0]}</td>
            <td>
                <span class="badge badge-${b.status}">${t('status_' + b.status)}</span>
            </td>
            <td>
                <button class="btn-icon">➜</button>
            </td>
        </tr>
    `).join('');
}

// --- Utilities ---
function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}