// Check authentication on dashboard
checkAuth();

let currentFilter = 'all';
let allBookings = [];
let showPast = false;

// Filter button handlers
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderBookings(allBookings);
    });
});

// Past bookings toggle handler
document.getElementById('show-past-toggle').addEventListener('change', (e) => {
    showPast = e.target.checked;
    renderBookings(allBookings);
});

// Load dashboard data
async function loadDashboard() {
    const data = await apiRequest('/bookings');
    
    if (!data || !data.bookings) {
        document.getElementById('bookings-list').innerHTML = 
            '<div class="empty-state">Failed to load bookings</div>';
        return;
    }
    
    allBookings = data.bookings // Store Globally
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const todayBookings = allBookings.filter(b => 
        b.scheduled_date.split('T')[0] === today && b.status !== 'cancelled'
    );
    
    const pendingBookings = allBookings.filter(b => b.status === 'pending');
    
    const weekBookings = allBookings.filter(b => {
        const date = b.scheduled_date.split('T')[0];
        return date >= today && date <= weekFromNow && b.status !== 'cancelled';
    });
    
    document.getElementById('today-count').textContent = todayBookings.length;
    document.getElementById('pending-count').textContent = pendingBookings.length;
    document.getElementById('week-count').textContent = weekBookings.length;
    
    renderBookings(allBookings);
}

function renderBookings(bookings) {
    const container = document.getElementById('bookings-list');
    
    // Sort by date
    const sorted = bookings.sort((a, b) => 
        new Date(a.scheduled_date) - new Date(b.scheduled_date)
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter by status
    let filtered = sorted;
    if (currentFilter !== 'all') {
        filtered = sorted.filter(b => b.status === currentFilter);
    }
    
    // Filter by date unless showPast is on
    if (!showPast) {
        filtered = filtered.filter(b => {
            const bookingDate = new Date(b.scheduled_date);
            return bookingDate >= today || b.status === 'pending';
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">No bookings found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(booking => `
        <div class="booking-card status-${booking.status}" data-id="${booking.id}">
            <div class="customer">
                <h4>${booking.customer_name}</h4>
                <p>${booking.email}</p>
            </div>
            <div class="service">
                <strong>${booking.service_name}</strong>
                <p>${booking.vehicle_type}</p>
            </div>
            <div class="datetime">
                <div class="date">${formatDate(booking.scheduled_date)}</div>
                <div class="time">${formatTime(booking.scheduled_time)}</div>
            </div>
            <div class="actions">
                <select onchange="updateStatus(${booking.id}, this.value)">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>${t('Pending')}</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>${t('Confirmed')}</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>${t('Completed')}</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>${t('Cancelled')}</option>
                </select>
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

async function updateStatus(bookingId, status) {
    const result = await apiRequest(`/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });

    if (result) {
        loadDashboard(); // Refresh the list
    }
}

// Apply translations to static elements
function applyTranslations() {
    // Navbar
    document.querySelector('.navbar h1').textContent = t('Gold Rush Detailing');
    document.getElementById('logout-btn').textContent = t('Logout');
    
    // Stats
    document.querySelectorAll('.stat-card h3')[0].textContent = t("TODAY'S BOOKINGS");
    document.querySelectorAll('.stat-card h3')[1].textContent = t('PENDING');
    document.querySelectorAll('.stat-card h3')[2].textContent = t('THIS WEEK');
    
    // Section header
    document.querySelector('.bookings-section h2').textContent = t('Upcoming Bookings');
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.dataset.filter;
        const labels = { all: 'All', pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
        btn.textContent = t(labels[filter]);
    });
    
    // Show past toggle
    document.querySelector('.toggle-label').lastChild.textContent = ' ' + t('Show past');
    
    // Set lang toggle state
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.checked = currentLang === 'en';
    }
}

// Call on page load
applyTranslations();

// Load dashboard on page load
loadDashboard();