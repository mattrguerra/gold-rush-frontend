// ===============================================
// Gold Rush Detailing - Comprehensive Admin App
// ===============================================

// Check authentication
checkAuth();

// Global state
let currentSection = 'dashboard';
let currentFilter = 'all';
let allBookings = [];
let allServices = [];
let allCustomers = [];
let showPast = false;

// ===============================================
// Navigation & Init
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initEventListeners();
    applyTranslations();
    loadDashboard();
});

function initNavigation() {
    // Sidebar navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });
    
    // Mobile sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }
}

function showSection(sectionName) {
    currentSection = sectionName;
    
    // Update active states
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    document.getElementById(`section-${sectionName}`).classList.add('active');
    const navItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('active');
    }
    
    // Load section data
    loadSectionData(sectionName);
}

async function loadSectionData(section) {
    switch(section) {
        case 'dashboard':
            await loadDashboard();
            break;
        case 'bookings':
            await loadBookings();
            break;
        case 'services':
            await loadServices();
            break;
        case 'customers':
            await loadCustomers();
            break;
        case 'availability':
            await loadAvailability();
            break;
        case 'settings':
            break;
    }
}

function initEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderBookings(allBookings);
        });
    });
    
    // Past bookings toggle
    const showPastToggle = document.getElementById('show-past-toggle');
    if (showPastToggle) {
        showPastToggle.addEventListener('change', (e) => {
            showPast = e.target.checked;
            renderBookings(allBookings);
        });
    }
    
    // Customer search
    const customerSearch = document.getElementById('customer-search');
    if (customerSearch) {
        customerSearch.addEventListener('input', (e) => {
            filterCustomers(e.target.value);
        });
    }
    
    // Settings forms
    const businessForm = document.getElementById('business-info-form');
    if (businessForm) {
        businessForm.addEventListener('submit', handleBusinessInfoUpdate);
    }
    
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordUpdate);
    }
}

// ===============================================
// Dashboard Section
// ===============================================

async function loadDashboard() {
    try {
        // Fetch both Stats (Server) and Bookings (Lists) in parallel
        const [statsData, bookingsData] = await Promise.all([
            apiRequest('/admin/stats'),
            apiRequest('/bookings')
        ]);
        
        // 1. Render Server-Side Stats
        if (statsData) {
            document.getElementById('today-count').textContent = statsData.todayCount || 0;
            document.getElementById('pending-count').textContent = statsData.pendingCount || 0;
            document.getElementById('week-count').textContent = statsData.weekCount || 0;
            const revenue = parseFloat(statsData.weekRevenue || 0);
            document.getElementById('revenue-count').textContent = `$${revenue.toLocaleString(undefined, {minimumFractionDigits: 0})}`;
            
            // Update sidebar badge
            const badge = document.getElementById('pending-badge');
            if (badge) badge.textContent = statsData.pendingCount || 0;
        }

        // 2. Render Lists
        if (bookingsData && bookingsData.bookings) {
            allBookings = bookingsData.bookings;
            loadTodaySchedule(allBookings);
            loadPendingActions(allBookings);
        }
    } catch (error) {
        console.error('Dashboard load failed:', error);
    }
}

function loadTodaySchedule(bookings) {
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => 
        b.scheduled_date.split('T')[0] === today && b.status !== 'cancelled'
    ).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    
    const container = document.getElementById('today-schedule');
    
    if (todayBookings.length === 0) {
        container.innerHTML = `<div class="empty-state">${t('No bookings for today')}</div>`;
        return;
    }
    
    container.innerHTML = todayBookings.map(booking => `
        <div class="booking-card status-${booking.status}" onclick="openBookingModal(${booking.id})" style="cursor: pointer; margin-bottom: 15px;">
            <div class="customer">
                <h4>${booking.customer_name}</h4>
                <p>${booking.email}</p>
            </div>
            <div class="service">
                <strong>${booking.service_name}</strong>
                <p>${booking.vehicle_type}</p>
            </div>
            <div class="datetime">
                <div class="time">${formatTime(booking.scheduled_time)}</div>
            </div>
            <div class="actions">
                <span class="status-badge status-${booking.status}">${t(capitalizeFirst(booking.status))}</span>
            </div>
        </div>
    `).join('');
}

function loadPendingActions(bookings) {
    const pendingBookings = bookings.filter(b => b.status === 'pending')
        .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));
    
    const container = document.getElementById('pending-actions');
    
    if (pendingBookings.length === 0) {
        container.innerHTML = `<div class="empty-state">${t('No pending actions')}</div>`;
        return;
    }
    
    container.innerHTML = pendingBookings.map(booking => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid var(--border);">
            <div>
                <strong>${booking.customer_name}</strong> ${t('requested')} ${booking.service_name}
                <div style="color: var(--text-light); font-size: 13px; margin-top: 3px;">
                    ${formatDate(booking.scheduled_date)} ${t('at')} ${formatTime(booking.scheduled_time)}
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px;" onclick="event.stopPropagation(); confirmBooking(${booking.id})">${t('Confirm')}</button>
                <button class="btn btn-secondary" style="padding: 8px 16px; font-size: 13px; border-color: var(--error); color: var(--error);" onclick="event.stopPropagation(); cancelBooking(${booking.id})">${t('Decline')}</button>
            </div>
        </div>
    `).join('');
}

// ===============================================
// Bookings Section
// ===============================================

async function loadBookings() {
    const data = await apiRequest('/bookings');
    
    if (!data || !data.bookings) {
        document.getElementById('bookings-list').innerHTML = 
            `<div class="empty-state">${t('Failed to load bookings')}</div>`;
        return;
    }
    
    allBookings = data.bookings;
    renderBookings(allBookings);
}

function renderBookings(bookings) {
    const container = document.getElementById('bookings-list');
    
    // Sort by date (newest first for better admin visibility)
    const sorted = bookings.sort((a, b) => 
        new Date(b.scheduled_date) - new Date(a.scheduled_date)
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
            // Show future bookings OR pending bookings regardless of date
            return bookingDate >= today || b.status === 'pending';
        });
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state">${t('No bookings found')}</div>`;
        return;
    }
    
    container.innerHTML = filtered.map(booking => `
        <div class="booking-card status-${booking.status}" onclick="openBookingModal(${booking.id})">
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
            <div class="actions" onclick="event.stopPropagation()">
                <select onchange="updateStatus(${booking.id}, this.value)" style="background: var(--dark); color: white; border: 1px solid var(--border); padding: 5px;">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>${t('Pending')}</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>${t('Confirmed')}</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>${t('Completed')}</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>${t('Cancelled')}</option>
                </select>
            </div>
        </div>
    `).join('');
}

async function openBookingModal(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    const modal = document.getElementById('booking-modal');
    const body = document.getElementById('booking-modal-body');
    const footer = document.getElementById('booking-modal-footer');
    
    body.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">${t('Customer')}</span>
            <span class="detail-value">${booking.customer_name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t('Email')}</span>
            <span class="detail-value">${booking.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t('Phone')}</span>
            <span class="detail-value">${booking.phone || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t('Service')}</span>
            <span class="detail-value">${booking.service_name}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t('Vehicle')}</span>
            <span class="detail-value">${booking.vehicle_type}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t('Date')}</span>
            <span class="detail-value">${formatDate(booking.scheduled_date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t('Time')}</span>
            <span class="detail-value">${formatTime(booking.scheduled_time)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">${t('Status')}</span>
            <span class="detail-value"><span class="status-badge status-${booking.status}">${t(capitalizeFirst(booking.status))}</span></span>
        </div>
        ${booking.notes ? `
            <div class="detail-row">
                <span class="detail-label">${t('Notes')}</span>
                <span class="detail-value">${booking.notes}</span>
            </div>
        ` : ''}
    `;
    
    footer.innerHTML = `
        ${booking.status === 'pending' ? `
            <button class="btn btn-primary" onclick="confirmBooking(${booking.id}); closeModal('booking-modal');">${t('Confirm Booking')}</button>
            <button class="btn btn-secondary" style="border-color: var(--error); color: var(--error);" onclick="cancelBooking(${booking.id}); closeModal('booking-modal');">${t('Cancel Booking')}</button>
        ` : ''}
        <button class="btn btn-secondary" onclick="closeModal('booking-modal')">${t('Close')}</button>
    `;
    
    modal.classList.add('active');
}

async function updateStatus(bookingId, newStatus) {
    const result = await apiRequest(`/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
    });

    if (result) {
        // Update local data
        const booking = allBookings.find(b => b.id === bookingId);
        if (booking) booking.status = newStatus;
        
        // Reload current view
        if (currentSection === 'dashboard') {
            loadDashboard();
        } else {
            renderBookings(allBookings);
        }
    }
}

async function confirmBooking(bookingId) {
    if (!confirm(t('Confirm this booking?'))) return;
    await updateStatus(bookingId, 'confirmed');
}

async function cancelBooking(bookingId) {
    if (!confirm(t('Cancel this booking?'))) return;
    await updateStatus(bookingId, 'cancelled');
}

// ===============================================
// Services Section
// ===============================================

async function loadServices() {
    const data = await apiRequest('/services');
    if (!data || !data.services) {
        document.getElementById('services-grid').innerHTML = `<div class="empty-state">${t('Failed to load services')}</div>`;
        return;
    }
    allServices = data.services;
    renderServices(allServices);
}

function renderServices(services) {
    const container = document.getElementById('services-grid');
    if (services.length === 0) {
        container.innerHTML = `<div class="empty-state">${t('No services found')}</div>`;
        return;
    }
    container.innerHTML = services.map(service => `
        <div class="service-card">
            <h3>${service.name}</h3>
            <p>${service.description || ''}</p>
            <span class="service-price">$${service.price}</span>
            <div class="service-actions">
                <button class="btn btn-secondary" onclick="editService(${service.id})">${t('Edit')}</button>
            </div>
        </div>
    `).join('');
}

function openAddServiceModal() {
    alert(t('Add Service') + ' - ' + t('Feature coming soon'));
}

function editService(serviceId) {
    alert(t('Edit Service') + ' #' + serviceId + ' - ' + t('Feature coming soon'));
}

// ===============================================
// Customers Section
// ===============================================

async function loadCustomers() {
    // Extract unique customers from bookings since there isn't a dedicated endpoint yet
    const uniqueCustomers = {};
    
    allBookings.forEach(booking => {
        const email = booking.email;
        if (!uniqueCustomers[email]) {
            uniqueCustomers[email] = {
                id: booking.customer_id || email,
                name: booking.customer_name,
                email: booking.email,
                phone: booking.phone || 'N/A',
                bookings: []
            };
        }
        uniqueCustomers[email].bookings.push(booking);
    });
    
    allCustomers = Object.values(uniqueCustomers).map(customer => ({
        ...customer,
        totalBookings: customer.bookings.length,
        lastVisit: customer.bookings
            .filter(b => b.status === 'completed')
            .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0]?.scheduled_date || null
    }));
    
    renderCustomers(allCustomers);
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customers-list');
    
    if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${t('No customers found')}</td></tr>`;
        return;
    }
    
    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td>${customer.name}</td>
            <td>${customer.email}</td>
            <td>${customer.phone}</td>
            <td>${customer.totalBookings}</td>
            <td>${customer.lastVisit ? formatDate(customer.lastVisit) : t('Never')}</td>
            <td>
                <button class="action-btn" onclick="viewCustomer('${customer.email}')">${t('View')}</button>
            </td>
        </tr>
    `).join('');
}

function filterCustomers(searchTerm) {
    const term = searchTerm.toLowerCase();
    const filtered = allCustomers.filter(customer =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term)
    );
    renderCustomers(filtered);
}

function viewCustomer(email) {
    const customer = allCustomers.find(c => c.email === email);
    if (!customer) return;
    alert(`${t('Customer')}: ${customer.name}\n${t('Email')}: ${customer.email}\n${t('Total Bookings')}: ${customer.totalBookings}\n\n${t('Feature coming soon')}: ${t('Detailed customer history')}`);
}

// ===============================================
// Availability Section
// ===============================================

async function loadAvailability() {
    await Promise.all([
        loadBlockedDates(),
        loadBusinessHours()
    ]);
}

async function loadBlockedDates() {
    const container = document.getElementById('blocked-dates-list');
    
    // Fallback if endpoint doesn't exist
    try {
        const data = await apiRequest('/admin/availability/blocked-dates');
        if (!data || !data.dates || data.dates.length === 0) {
            container.innerHTML = `<div class="empty-state">${t('No blocked dates')}</div>`;
            return;
        }
        
        container.innerHTML = data.dates.map(date => `
            <div class="blocked-date-item">
                <span>${formatDate(date.date)}</span>
                <button onclick="unblockDate('${date.date}')">${t('Remove')}</button>
            </div>
        `).join('');
    } catch(e) {
        container.innerHTML = `<div class="empty-state">${t('No blocked dates')}</div>`;
    }
}

async function loadBusinessHours() {
    const container = document.getElementById('business-hours');
    
    try {
        const data = await apiRequest('/admin/availability/hours');
        if (data && data.hours) {
            container.innerHTML = Object.entries(data.hours).map(([day, hours]) => `
                <div class="hours-row">
                    <span class="hours-day">${t(capitalizeFirst(day))}</span>
                    <span class="hours-times">${hours.closed ? t('Closed') : `${hours.open} - ${hours.close}`}</span>
                </div>
            `).join('');
        } else {
            // Default View
            throw new Error('No hours data');
        }
    } catch(e) {
        // Fallback Display
        const days = [
            { name: t('Monday'), hours: '9:00 AM - 6:00 PM' },
            { name: t('Tuesday'), hours: '9:00 AM - 6:00 PM' },
            { name: t('Wednesday'), hours: '9:00 AM - 6:00 PM' },
            { name: t('Thursday'), hours: '9:00 AM - 6:00 PM' },
            { name: t('Friday'), hours: '9:00 AM - 6:00 PM' },
            { name: t('Saturday'), hours: '10:00 AM - 4:00 PM' },
            { name: t('Sunday'), hours: t('Closed') }
        ];
        
        container.innerHTML = days.map(day => `
            <div class="hours-row">
                <span class="hours-day">${day.name}</span>
                <span class="hours-times">${day.hours}</span>
            </div>
        `).join('');
    }
}

async function blockDate() {
    const dateInput = document.getElementById('block-date-input');
    const date = dateInput.value;
    
    if (!date) {
        alert(t('Please select a date'));
        return;
    }
    
    const result = await apiRequest('/admin/availability/block-date', {
        method: 'POST',
        body: JSON.stringify({ date })
    });
    
    if (result) {
        alert(t('Date blocked successfully'));
        dateInput.value = '';
        await loadBlockedDates();
    }
}

async function unblockDate(date) {
    if (!confirm(t('Unblock this date?'))) return;
    
    const result = await apiRequest('/admin/availability/unblock-date', {
        method: 'DELETE',
        body: JSON.stringify({ date })
    });
    
    if (result) {
        alert(t('Date unblocked'));
        await loadBlockedDates();
    }
}

// ===============================================
// Settings Section
// ===============================================

async function handleBusinessInfoUpdate(e) {
    e.preventDefault();
    const phone = document.getElementById('business-phone').value;
    const email = document.getElementById('business-email').value;
    
    const result = await apiRequest('/admin/settings/business-info', {
        method: 'PUT',
        body: JSON.stringify({ phone, email })
    });
    
    if (result) alert(t('Business information updated successfully'));
    else alert(t('Failed to update business information'));
}

async function handlePasswordUpdate(e) {
    e.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
        alert(t('New passwords do not match'));
        return;
    }
    
    if (newPassword.length < 8) {
        alert(t('Password must be at least 8 characters'));
        return;
    }
    
    const result = await apiRequest('/admin/settings/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
    });
    
    if (result) {
        alert(t('Password updated successfully'));
        e.target.reset();
    } else {
        alert(t('Failed to update password'));
    }
}

// ===============================================
// Modal Functions
// ===============================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===============================================
// Utility Functions
// ===============================================

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Handle timezone offsets by appending Timezone info if missing or using UTC
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===============================================
// Translations
// ===============================================

function applyTranslations() {
    if (typeof t !== 'function') return; // Safety check
    
    // Navbar
    document.querySelector('.navbar h1').textContent = t('Gold Rush Detailing');
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.textContent = t('Logout');
    
    // Stats (Dashboard)
    const statHeaders = document.querySelectorAll('.stat-card h3');
    if (statHeaders[0]) statHeaders[0].textContent = t("TODAY'S BOOKINGS");
    if (statHeaders[1]) statHeaders[1].textContent = t('PENDING');
    if (statHeaders[2]) statHeaders[2].textContent = t('THIS WEEK');
    if (statHeaders[3]) statHeaders[3].textContent = t('WEEKLY REVENUE');
    
    // Dashboard cards
    const dashboardCards = document.querySelectorAll('.dashboard-card .card-header h3');
    if (dashboardCards[0]) dashboardCards[0].textContent = t("Today's Schedule");
    if (dashboardCards[1]) dashboardCards[1].textContent = t('Pending Actions');
    
    // Search placeholder
    const customerSearch = document.getElementById('customer-search');
    if (customerSearch) customerSearch.placeholder = t('Search customers...');
}

// ===============================================
// Error Handling
// ===============================================

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});