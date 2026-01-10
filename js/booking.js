const API_URL = 'https://gold-rush-backend-production.up.railway.app/api';

// Booking state
let selectedService = null;
let selectedDate = null;
let selectedTime = null;

// Load services on page load
document.addEventListener('DOMContentLoaded', loadServices);

async function loadServices() {
    try {
        const response = await fetch(`${API_URL}/services`);
        const data = await response.json();
        
        const container = document.getElementById('services-list');
        container.innerHTML = data.services.map(service => `
            <div class="service-card" onclick="selectService(${service.id}, '${service.name}', ${service.base_price}, ${service.duration_minutes})">
                <h4>${service.name}</h4>
                <p>${service.description || ''}</p>
                <div class="price">$${service.base_price}</div>
                <div class="duration">${service.duration_minutes} minutes</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load services:', err);
        document.getElementById('services-list').innerHTML = '<p style="color: #ef4444;">Failed to load services. Please refresh.</p>';
    }
}

function selectService(id, name, price, duration) {
    selectedService = { id, name, price, duration };
    
    // Update UI - highlight selected card
    document.querySelectorAll('.service-card').forEach(card => card.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('booking-date').min = today;
    document.getElementById('booking-date').value = '';
    
    // Reset time selection
    selectedTime = null;
    document.getElementById('time-slots').innerHTML = '<p style="color: #888;">Select a date first</p>';
    document.getElementById('btn-to-step-3').disabled = true;
    
    // Go to next step after short delay
    setTimeout(() => goToStep(2), 300);
}

function goToStep(step) {
    // Validate before moving forward
    if (step === 3 && (!selectedDate || !selectedTime)) {
        alert('Please select a date and time');
        return;
    }
    
    if (step === 4) {
        if (!validateCustomerForm()) return;
        updateSummary();
    }
    
    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
    
    // Show target step
    document.getElementById(`step-${step}`).classList.remove('hidden');
    
    // Update progress indicators
    document.querySelectorAll('.step').forEach(s => {
        const stepNum = parseInt(s.dataset.step);
        s.classList.remove('active', 'completed');
        if (stepNum < step) s.classList.add('completed');
        if (stepNum === step) s.classList.add('active');
    });
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Date selection handler
document.getElementById('booking-date').addEventListener('change', async (e) => {
    selectedDate = e.target.value;
    selectedTime = null;
    document.getElementById('btn-to-step-3').disabled = true;
    
    await loadTimeSlots(selectedDate);
});

async function loadTimeSlots(date) {
    const container = document.getElementById('time-slots');
    container.innerHTML = '<p style="color: #888;">Loading...</p>';
    
    try {
        const response = await fetch(`${API_URL}/availability/${date}`);
        const data = await response.json();
        
        if (data.blocked) {
            container.innerHTML = '<p style="color: #ef4444;">Not available on this date</p>';
            return;
        }
        
        const slots = data.available_slots || ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
        const booked = data.booked_times || [];
        
        container.innerHTML = slots.map(slot => {
            const isBooked = booked.includes(slot);
            return `
                <div class="time-slot ${isBooked ? 'unavailable' : ''}" 
                     onclick="${isBooked ? '' : `selectTime('${slot}')`}">
                    ${formatTime(slot)}
                </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<p style="color: #ef4444;">Failed to load times</p>';
    }
}

function selectTime(time) {
    selectedTime = time;
    
    document.querySelectorAll('.time-slot').forEach(slot => slot.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    document.getElementById('btn-to-step-3').disabled = false;
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
    });
}

function validateCustomerForm() {
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const vehicle = document.getElementById('vehicle-type').value;
    const address = document.getElementById('customer-address').value;
    
    if (!name || !email || !phone || !vehicle || !address) {
        alert('Please fill in all required fields');
        return false;
    }
    
    return true;
}

function updateSummary() {
    document.getElementById('summary-service').textContent = selectedService.name;
    document.getElementById('summary-date').textContent = formatDate(selectedDate);
    document.getElementById('summary-time').textContent = formatTime(selectedTime);
    document.getElementById('summary-vehicle').textContent = document.getElementById('vehicle-type').value;
    document.getElementById('summary-address').textContent = document.getElementById('customer-address').value;
    document.getElementById('summary-price').textContent = `$${selectedService.price}`;
}

async function submitBooking() {
    const btn = document.querySelector('.btn-confirm');
    btn.disabled = true;
    btn.textContent = 'Submitting...';
    
const bookingData = {
    service_id: selectedService.id,
    scheduled_date: selectedDate,
    scheduled_time: selectedTime,
    name: document.getElementById('customer-name').value,
    email: document.getElementById('customer-email').value,
    phone: document.getElementById('customer-phone').value,
    vehicle_type: document.getElementById('vehicle-type').value,
    address: document.getElementById('customer-address').value,
    notes: document.getElementById('booking-notes').value
};
    
    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Show success
            document.getElementById('confirm-email').textContent = bookingData.email;
            document.getElementById('confirm-date').textContent = formatDate(selectedDate);
            document.getElementById('confirm-time').textContent = formatTime(selectedTime);
            
            document.querySelectorAll('.booking-step').forEach(s => s.classList.add('hidden'));
            document.getElementById('step-success').classList.remove('hidden');
            
            // Mark all steps complete
            document.querySelectorAll('.step').forEach(s => s.classList.add('completed'));
        } else {
            alert(data.error || 'Booking failed. Please try again.');
            btn.disabled = false;
            btn.textContent = 'Confirm Booking';
        }
    } catch (err) {
        alert('Connection error. Please try again.');
        btn.disabled = false;
        btn.textContent = 'Confirm Booking';
    }
}