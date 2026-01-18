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

// Instead of calculating stats, fetch from endpoint
const statsData = await apiRequest('/admin/stats');
if (statsData) {
    document.getElementById('today-count').textContent = statsData.todayCount;
    document.getElementById('pending-count').textContent = statsData.pendingCount;
    document.getElementById('week-count').textContent = statsData.weekCount;
    document.getElementById('revenue-count').textContent = `$${statsData.weekRevenue.toFixed(0)}`;
}

function showSection(sectionName) {
    currentSection = sectionName;
    
    // Update sections
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
            // Settings are forms, no loading needed
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
    const data = await apiRequest('/bookings');
    
    if (!data || !data.bookings) {
        console.error('Failed to load dashboard data');
        return;
    }
    
    allBookings = data.bookings;
    
    await Promise.all([
        updateStats(allBookings),
        loadTodaySchedule(allBookings),
        loadPendingActions(allBookings)
    ]);
}

function updateStats(bookings) {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const todayBookings = bookings.filter(b => 
        b.scheduled_date.split('T')[0] === today && b.status !== 'cancelled'
    );
    
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    
    const weekBookings = bookings.filter(b => {
        const date = b.scheduled_date.split('T')[0];
        return date >= today && date <= weekFromNow && b.status !== 'cancelled';
    });
    
    // Calculate revenue (assuming price field exists)
    const weekRevenue = weekBookings.reduce((sum, b) => {
        const price = parseFloat(b.price) || 0;
        return sum + price;
    }, 0);
    
    document.getElementById('today-count').textContent = todayBookings.length;
    document.getElementById('pending-count').textContent = pendingBookings.length;
    document.getElementById('week-count').textContent = weekBookings.length;
    document.getElementById('revenue-count').textContent = `$${weekRevenue.toFixed(0)}`;
    
    // Update pending badge in sidebar
    const badge = document.getElementById('pending-badge');
    if (badge) {
        badge.textContent = pendingBookings.length;
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
        document.getElementById('services-grid').innerHTML = 
            `<div class="empty-state">${t('Failed to load services')}</div>`;
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

// Continue in Part 2...// ===============================================
// Customers Section
// ===============================================

async function loadCustomers() {
    // Since your backend may not have a customers endpoint yet,
    // we'll extract unique customers from bookings
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
    // This endpoint may not exist yet in your backend
    // For now, show placeholder
    const container = document.getElementById('blocked-dates-list');
    container.innerHTML = `<div class="empty-state" style="padding: 20px; font-size: 13px;">${t('No blocked dates')}<br><br><small style="color: var(--text-muted);">${t('Note')}: ${t('This feature requires backend endpoint')}: GET /api/admin/availability/blocked-dates</small></div>`;
    
    const data = await apiRequest('/admin/availability/blocked-dates');
    if (!data || !data.dates) {
        container.innerHTML = `<div class="empty-state">${t('No blocked dates')}</div>`;
        return;
    }
    
    container.innerHTML = data.dates.map(date => `
        <div class="blocked-date-item">
            <span>${formatDate(date.date)}</span>
            <button onclick="unblockDate('${date.date}')">${t('Remove')}</button>
        </div>
    `).join('');
}

async function loadBusinessHours() {
    const container = document.getElementById('business-hours');
    
    // Default hours - replace with API call when available
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
    
    
    const data = await apiRequest('/admin/availability/hours');
    if (data && data.hours) {
        container.innerHTML = Object.entries(data.hours).map(([day, hours]) => `
            <div class="hours-row">
                <span class="hours-day">${t(capitalizeFirst(day))}</span>
                <span class="hours-times">${hours.closed ? t('Closed') : `${hours.open} - ${hours.close}`}</span>
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
    
    alert(`${t('Block date')}: ${date}\n\n${t('Note')}: ${t('This feature requires backend endpoint')}: POST /api/admin/availability/block-date`);
    

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
    
    alert(`${t('Unblock date')}: ${date}\n\n${t('Note')}: ${t('This feature requires backend endpoint')}: DELETE /api/admin/availability/unblock-date`);
    
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
    
    alert(`${t('Update business info')}:\n${t('Phone')}: ${phone}\n${t('Email')}: ${email}\n\n${t('Note')}: ${t('This feature requires backend endpoint')}: PUT /api/admin/settings/business-info`);
    
    const result = await apiRequest('/admin/settings/business-info', {
        method: 'PUT',
        body: JSON.stringify({ phone, email })
    });
    
    if (result) {
        alert(t('Business information updated successfully'));
    } else {
        alert(t('Failed to update business information'));
    }
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
    
    alert(`${t('Update password')}\n\n${t('Note')}: ${t('This feature requires backend endpoint')}: PUT /api/admin/settings/password`);
    
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
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===============================================
// Translations
// ===============================================

function applyTranslations() {
    // Navbar
    document.querySelector('.navbar h1').textContent = t('Gold Rush Detailing');
    document.getElementById('logout-btn').textContent = t('Logout');
    
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
    
    // Section headers
    document.querySelectorAll('.section-header h2').forEach((h2, index) => {
        const sections = ['Panel', 'Reservas', 'Servicios', 'Clientes', 'Disponibilidad', 'Configuración'];
        if (sections[index]) h2.textContent = t(sections[index]);
    });
    
    // Sidebar nav
    const navLabels = document.querySelectorAll('.nav-label');
    const navTexts = ['Panel', 'Reservas', 'Servicios', 'Clientes', 'Disponibilidad', 'Configuración'];
    navLabels.forEach((label, index) => {
        if (navTexts[index]) label.textContent = t(navTexts[index]);
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filter = btn.dataset.filter;
        const labels = { 
            all: 'All', 
            pending: 'Pending', 
            confirmed: 'Confirmed', 
            completed: 'Completed', 
            cancelled: 'Cancelled' 
        };
        if (labels[filter]) btn.textContent = t(labels[filter]);
    });
    
    // Toggle labels
    const toggleLabel = document.querySelector('.toggle-label span');
    if (toggleLabel) toggleLabel.textContent = t('Show past');
    
    // Search placeholder
    const customerSearch = document.getElementById('customer-search');
    if (customerSearch) customerSearch.placeholder = t('Search customers...');
    
    // Table headers
    const tableHeaders = document.querySelectorAll('.data-table th');
    const headerTexts = ['Name', 'Email', 'Phone', 'Total Bookings', 'Last Visit', 'Actions'];
    tableHeaders.forEach((th, index) => {
        if (headerTexts[index]) th.textContent = t(headerTexts[index]);
    });
    
    // Availability section
    const availabilityCards = document.querySelectorAll('.availability-card h3');
    if (availabilityCards[0]) availabilityCards[0].textContent = t('Block Dates');
    if (availabilityCards[1]) availabilityCards[1].textContent = t('Business Hours');
    
    const availabilityH4 = document.querySelector('.availability-card h4');
    if (availabilityH4) availabilityH4.textContent = t('Blocked Dates');
    
    // Settings section
    const settingsCards = document.querySelectorAll('.settings-card h3');
    if (settingsCards[0]) settingsCards[0].textContent = t('Business Information');
    if (settingsCards[1]) settingsCards[1].textContent = t('Change Password');
    
    // Form labels
    const formLabels = document.querySelectorAll('.form-group label');
    const labelTexts = {
        'Business Name': 'Nombre del Negocio',
        'Phone': 'Teléfono',
        'Email': 'Correo',
        'Current Password': 'Contraseña Actual',
        'New Password': 'Nueva Contraseña',
        'Confirm New Password': 'Confirmar Nueva Contraseña'
    };
    formLabels.forEach(label => {
        const text = label.textContent.trim();
        if (labelTexts[text]) label.textContent = t(text);
    });
    
    // Buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text === 'Save Changes' || text === 'Guardar Cambios') {
            btn.textContent = t('Save Changes');
        } else if (text === 'Update Password' || text === 'Actualizar Contraseña') {
            btn.textContent = t('Update Password');
        } else if (text === '+ Add Service' || text === '+ Agregar Servicio') {
            btn.textContent = t('+ Add Service');
        } else if (text === 'Block This Date' || text === 'Bloquear Esta Fecha') {
            btn.textContent = t('Block This Date');
        }
    });
    
    // Set lang toggle state
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.checked = currentLang === 'en';
    }
    
    // Modal
    const modalHeader = document.querySelector('.modal-header h3');
    if (modalHeader) modalHeader.textContent = t('Booking Details');
}

// ===============================================
// Error Handling
// ===============================================

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
