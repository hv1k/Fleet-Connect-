// FleetConnect Theme Toggle — loads early to prevent flash
(function() {
    var theme = localStorage.getItem('fc-theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    document.documentElement.classList.remove('light-mode');
    document.body && document.body.classList.remove('dark');

    function createToggle() {
        if (document.getElementById('themeToggleBtn')) return;

        var btn = document.createElement('button');
        btn.id = 'themeToggleBtn';
        btn.className = 'theme-toggle-btn';
        btn.title = 'Toggle theme';
        updateBtn(btn, theme);

        btn.addEventListener('click', function() {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('fc-theme', next);
            updateBtn(btn, next);
        });

        // Place in sidebar footer if it exists, otherwise append to body
        var footer = document.querySelector('.admin-sidebar-footer');
        if (footer) {
            footer.appendChild(btn);
        } else {
            // Fallback: fixed position for pages without sidebar
            btn.style.position = 'fixed';
            btn.style.top = '16px';
            btn.style.right = '16px';
            btn.style.zIndex = '999';
            btn.style.width = 'auto';
            btn.style.margin = '0';
            document.body.appendChild(btn);
        }
    }

    function updateBtn(btn, mode) {
        if (mode === 'dark') {
            btn.innerHTML = '☀️ <span>Light Mode</span>';
        } else {
            btn.innerHTML = '🌙 <span>Dark Mode</span>';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggle);
    } else {
        createToggle();
    }
})();
