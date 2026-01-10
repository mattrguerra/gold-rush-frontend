const translations = {
    es: {
        // Header
        'Gold Rush Detailing': 'Gold Rush Detailing',
        'Logout': 'Cerrar Sesión',

        // Stats
        "TODAY'S BOOKINGS": 'CITAS DE HOY',
        'PENDING': 'PENDIENTES',
        'THIS WEEK': 'ESTA SEMANA',

        // Bookings section
        'Upcoming Bookings': 'Próximas Citas',
        'No bookings found': 'No se encontraron citas',

        // Filters
        'All': 'Todas',
        'Pending': 'Pendiente',
        'Confirmed': 'Confirmada',
        'Completed': 'Completada',
        'Cancelled': 'Cancelada',
        'Show past': 'Mostrar pasadas',

        // Login
        'Admin Login': 'Inicio de Sesión',
        'Username': 'Usuario',
        'Password': 'Contraseña',
        'Login': 'Entrar',
        'Connection error. Is the server running?': 'Error de conexión. ¿Está el servidor funcionando?',
        'Invalid credentials': 'Credenciales inválidas'
    },
    en: {
        // English is the fallback - keeps original text
    }
};

let currentLang = localStorage.getItem('lang') || 'es';

function t(text) {
    if (currentLang === 'en') return text;
    return translations.es[text] || text;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    location.reload();
}