document.addEventListener('DOMContentLoaded', () => {
    
    // --- Login Logic ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            // Visual loading state
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verificando...';
            btn.style.opacity = '0.8';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 800);
        });
    }

    // --- Modal Logic ---
    window.openModal = function(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'flex';
            // Animation reset
            modal.querySelector('.modal-content').style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
            setTimeout(() => {
                modal.querySelector('.modal-content').style.transition = '0.3s ease';
                modal.querySelector('.modal-content').style.opacity = '1';
                modal.querySelector('.modal-content').style.transform = 'translateY(0)';
            }, 10);
        }
    };

    window.closeModal = function(id) {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    };

    // --- Navigation Logic ---
    window.switchView = function(viewName) {
        // Update Sidebar UI
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // This is where you would normally hide/show different sections.
        // For this demo, we just highlight the clicked link.
        event.currentTarget.classList.add('active');
        
        console.log("Switched to view:", viewName);
    };

    // Close modal when clicking outside
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    });
});