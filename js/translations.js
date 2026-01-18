const translations = {
    es: {
        // Header & Navigation
        'Gold Rush Detailing': 'Gold Rush Detailing',
        'Logout': 'Cerrar Sesión',
        'Panel': 'Panel',
        'Reservas': 'Reservas',
        'Servicios': 'Servicios',
        'Clientes': 'Clientes',
        'Disponibilidad': 'Disponibilidad',
        'Configuración': 'Configuración',

        // Stats
        "TODAY'S BOOKINGS": 'CITAS DE HOY',
        'PENDING': 'PENDIENTES',
        'THIS WEEK': 'ESTA SEMANA',
        'WEEKLY REVENUE': 'INGRESOS SEMANALES',

        // Dashboard
        "Today's Schedule": 'Agenda de Hoy',
        'Pending Actions': 'Acciones Pendientes',
        'No bookings for today': 'No hay citas para hoy',
        'No pending actions': 'No hay acciones pendientes',
        'requested': 'solicitó',
        'at': 'a las',

        // Bookings
        'Upcoming Bookings': 'Próximas Citas',
        'No bookings found': 'No se encontraron citas',
        'Failed to load bookings': 'Error al cargar citas',
        'Booking Details': 'Detalles de la Reserva',
        'Confirm Booking': 'Confirmar Reserva',
        'Cancel Booking': 'Cancelar Reserva',
        'Confirm this booking?': '¿Confirmar esta reserva?',
        'Cancel this booking?': '¿Cancelar esta reserva?',

        // Filters & Status
        'All': 'Todas',
        'Pending': 'Pendiente',
        'Confirmed': 'Confirmada',
        'Completed': 'Completada',
        'Cancelled': 'Cancelada',
        'Show past': 'Mostrar pasadas',

        // Actions
        'Confirm': 'Confirmar',
        'Decline': 'Rechazar',
        'Edit': 'Editar',
        'View': 'Ver',
        'Close': 'Cerrar',
        'Save Changes': 'Guardar Cambios',
        'Update Password': 'Actualizar Contraseña',
        'Remove': 'Eliminar',

        // Services
        'No services found': 'No se encontraron servicios',
        'Failed to load services': 'Error al cargar servicios',
        '+ Add Service': '+ Agregar Servicio',
        'Add Service': 'Agregar Servicio',
        'Edit Service': 'Editar Servicio',

        // Customers
        'Search customers...': 'Buscar clientes...',
        'No customers found': 'No se encontraron clientes',
        'Failed to load customers': 'Error al cargar clientes',
        'Detailed customer history': 'Historial detallado del cliente',

        // Customer/Booking Fields
        'Customer': 'Cliente',
        'Name': 'Nombre',
        'Email': 'Correo',
        'Phone': 'Teléfono',
        'Service': 'Servicio',
        'Vehicle': 'Vehículo',
        'Date': 'Fecha',
        'Time': 'Hora',
        'Status': 'Estado',
        'Price': 'Precio',
        'Total Bookings': 'Total de Reservas',
        'Last Visit': 'Última Visita',
        'Actions': 'Acciones',
        'Notes': 'Notas',
        'Never': 'Nunca',

        // Availability
        'Block Dates': 'Bloquear Fechas',
        'Block This Date': 'Bloquear Esta Fecha',
        'Block date': 'Bloquear fecha',
        'Blocked Dates': 'Fechas Bloqueadas',
        'No blocked dates': 'No hay fechas bloqueadas',
        'Business Hours': 'Horario de Atención',
        'Please select a date': 'Por favor selecciona una fecha',
        'Unblock this date?': '¿Desbloquear esta fecha?',
        'Date blocked successfully': 'Fecha bloqueada exitosamente',
        'Date unblocked': 'Fecha desbloqueada',
        'Unblock date': 'Desbloquear fecha',

        // Days of week
        'Monday': 'Lunes',
        'Tuesday': 'Martes',
        'Wednesday': 'Miércoles',
        'Thursday': 'Jueves',
        'Friday': 'Viernes',
        'Saturday': 'Sábado',
        'Sunday': 'Domingo',
        'Closed': 'Cerrado',

        // Settings
        'Business Information': 'Información del Negocio',
        'Business Name': 'Nombre del Negocio',
        'Change Password': 'Cambiar Contraseña',
        'Current Password': 'Contraseña Actual',
        'New Password': 'Nueva Contraseña',
        'Confirm New Password': 'Confirmar Nueva Contraseña',
        'New passwords do not match': 'Las contraseñas no coinciden',
        'Password must be at least 8 characters': 'La contraseña debe tener al menos 8 caracteres',
        'Update business info': 'Actualizar información del negocio',
        'Update password': 'Actualizar contraseña',
        'Business information updated successfully': 'Información del negocio actualizada exitosamente',
        'Failed to update business information': 'Error al actualizar información del negocio',
        'Password updated successfully': 'Contraseña actualizada exitosamente',
        'Failed to update password': 'Error al actualizar contraseña',

        // Login
        'Admin Login': 'Inicio de Sesión',
        'Username': 'Usuario',
        'Password': 'Contraseña',
        'Login': 'Entrar',
        'Connection error. Is the server running?': 'Error de conexión. ¿Está el servidor funcionando?',
        'Invalid credentials': 'Credenciales inválidas',

        // General
        'Note': 'Nota',
        'Feature coming soon': 'Función próximamente',
        'This feature requires backend endpoint': 'Esta función requiere un endpoint en el backend',
        'Loading...': 'Cargando...'
    },
    en: {
        // English is the fallback - keeps original text
        // All keys return themselves
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
