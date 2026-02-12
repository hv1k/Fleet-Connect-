// Hamburger Menu for Mobile Sidebar
(function() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    // Create hamburger button
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.innerHTML = '☰';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    document.body.appendChild(hamburger);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'hamburger-overlay';
    document.body.appendChild(overlay);

    function openSidebar() {
        sidebar.classList.add('sidebar-open');
        overlay.classList.add('active');
        hamburger.innerHTML = '✕';
    }

    function closeSidebar() {
        sidebar.classList.remove('sidebar-open');
        overlay.classList.remove('active');
        hamburger.innerHTML = '☰';
    }

    hamburger.addEventListener('click', function() {
        if (sidebar.classList.contains('sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    overlay.addEventListener('click', closeSidebar);

    // Close on nav link click
    sidebar.querySelectorAll('.admin-nav-item').forEach(function(link) {
        link.addEventListener('click', closeSidebar);
    });

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        .hamburger-btn {
            display: none;
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 200;
            background: var(--bg-card, #242424);
            border: 1px solid var(--border, #333);
            border-radius: 8px;
            padding: 0;
            width: 40px;
            height: 40px;
            font-size: 1.3rem;
            color: var(--text-primary, #f5f0e8);
            cursor: pointer;
            line-height: 1;
            transition: background 0.2s;
        }
        .hamburger-btn:hover {
            background: var(--bg-hover, #333);
        }
        .hamburger-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 98;
        }
        .hamburger-overlay.active {
            display: block;
        }

        @media (max-width: 768px) {
            .hamburger-btn {
                display: block;
            }
            .admin-sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 260px !important;
                height: 100vh !important;
                border-right: 1px solid var(--border, #333) !important;
                border-bottom: none !important;
                z-index: 99 !important;
                overflow-y: auto !important;
            }
            .admin-sidebar.sidebar-open {
                transform: translateX(0);
            }
            .main-content {
                margin-left: 0 !important;
            }
        }
    `;
    document.head.appendChild(style);
})();
