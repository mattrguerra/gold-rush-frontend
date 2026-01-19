// --- Translation Dictionary ---
const i18n = {
    es: {
        navOverview: "Resumen",
        navUsers: "Usuarios",
        navTools: "Herramientas",
        navSettings: "Ajustes",
        welcomeTitle: "Panel de Control",
        welcomeSub: "Bienvenido de nuevo, Matt.",
        toolSystem: "Sistema",
        toolBackup: "Respaldo",
        toolCache: "Caché",
        toolAudit: "Auditoría",
        statusActive: "Activo",
        statusIdle: "Inactivo"
    },
    en: {
        navOverview: "Overview",
        navUsers: "Users",
        navTools: "Tools",
        navSettings: "Settings",
        welcomeTitle: "Control Panel",
        welcomeSub: "Welcome back, Matt.",
        toolSystem: "System Health",
        toolBackup: "Database Backup",
        toolCache: "Clear Cache",
        toolAudit: "User Audit",
        statusActive: "Active",
        statusIdle: "Idle"
    }
};

// --- App Controller ---
document.addEventListener('DOMContentLoaded', () => {
    let currentLang = 'es';
    const viewContainer = document.getElementById('viewContainer');
    const pageTitle = document.getElementById('pageTitle');
    
    // 1. View Renderer
    const views = {
        overview: () => `
            <div class="glass-panel" style="padding: 3rem; text-align: center;">
                <h2 data-i18n="welcomeTitle" style="font-size: 2rem; margin-bottom: 1rem;">${i18n[currentLang].welcomeTitle}</h2>
                <p data-i18n="welcomeSub" style="color: var(--text-secondary);">${i18n[currentLang].welcomeSub}</p>
            </div>
        `,
        tools: () => {
            // Render Tools Grid
            return `
                <div class="tools-grid">
                    ${renderToolCard('heart-pulse', 'toolSystem', 'statusActive')}
                    ${renderToolCard('database', 'toolBackup', 'statusIdle')}
                    ${renderToolCard('broom', 'toolCache', 'statusActive')}
                    ${renderToolCard('clipboard-check', 'toolAudit', 'statusActive')}
                </div>
            `;
        }
    };

    function renderToolCard(icon, titleKey, statusKey) {
        return `
            <div class="glass-panel tool-card">
                <div class="tool-icon"><i class="fa-solid fa-${icon}"></i></div>
                <div>
                    <h3 data-i18n="${titleKey}" style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${i18n[currentLang][titleKey]}</h3>
                    <span data-i18n="${statusKey}" style="font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">
                        ${i18n[currentLang][statusKey]}
                    </span>
                </div>
            </div>
        `;
    }

    // 2. Navigation Logic
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // UI Updates
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // View Switching
            const target = btn.dataset.target;
            if (views[target]) {
                viewContainer.innerHTML = views[target]();
            } else {
                viewContainer.innerHTML = `<div class="glass-panel" style="padding:2rem">Module ${target} loading...</div>`;
            }

            // Update Header Title
            const span = btn.querySelector('span');
            pageTitle.setAttribute('data-i18n', span.getAttribute('data-i18n'));
            updateLanguageText();
        });
    });

    // 3. Language Toggle Logic
    document.getElementById('langToggle').addEventListener('click', () => {
        currentLang = currentLang === 'es' ? 'en' : 'es';
        document.getElementById('langToggle').textContent = currentLang === 'es' ? 'EN / ES' : 'ES / EN';
        updateLanguageText();
        
        // Re-render current view if necessary to update dynamic strings
        const activeBtn = document.querySelector('.nav-btn.active');
        if(activeBtn) activeBtn.click();
    });

    function updateLanguageText() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (i18n[currentLang][key]) {
                el.textContent = i18n[currentLang][key];
            }
        });
    }

    // Init
    document.querySelector('.nav-btn[data-target="overview"]').click();
});