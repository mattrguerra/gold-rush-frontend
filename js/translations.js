// ===============================================
// Gold Rush Admin - Localization Engine
// ===============================================

const DICTIONARY = {
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
        'Información del Negocio': 'Información del Negocio',
        'Gold Rush Detailing': 'Gold Rush Detailing',
        'Admin Login': 'Inicio de Sesión',
        'Username': 'Usuario',
        'Password': 'Contraseña',
        'Login': 'Entrar'
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
        'Información del Negocio': 'Business Info',
        'Gold Rush Detailing': 'Gold Rush Detailing',
        'Admin Login': 'Admin Portal',
        'Username': 'Username',
        'Password': 'Password',
        'Login': 'Enter Dashboard'
    }
};

// Global State
window.currentLang = localStorage.getItem('lang') || 'es';

// 1. Translation Function
function t(key) {
    if (window.currentLang === 'en') return key; // Fallback to key for English
    return DICTIONARY.es[key] || key;
}

// 2. Language Toggler
function toggleGlobalLanguage() {
    const newLang = window.currentLang === 'es' ? 'en' : 'es';
    localStorage.setItem('lang', newLang);
    window.location.reload();
}

// 3. Auto-Apply to HTML Elements on Load
document.addEventListener('DOMContentLoaded', () => {
    // Sync Toggle Switch State
    const toggle = document.getElementById('lang-toggle');
    if (toggle) toggle.checked = (window.currentLang === 'en');

    // Translate Elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Translate Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const dateLocale = window.currentLang === 'en' ? 'en-US' : 'es-ES';
        dateEl.textContent = new Date().toLocaleDateString(dateLocale, { 
            weekday: 'long', month: 'long', day: 'numeric' 
        });
    }
});