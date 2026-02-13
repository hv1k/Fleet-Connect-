// FleetConnect Theme Toggle — loads early to prevent flash
(function() {
    var theme = localStorage.getItem('fc-theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    // Remove old theme classes/attributes
    document.documentElement.classList.remove('light-mode');
    document.body && document.body.classList.remove('dark');

    function createToggle() {
        if (document.getElementById('themeToggleBtn')) return;
        var btn = document.createElement('button');
        btn.id = 'themeToggleBtn';
        btn.className = 'theme-toggle-btn';
        btn.title = 'Toggle theme';
        btn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        btn.addEventListener('click', function() {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('fc-theme', next);
            btn.innerHTML = next === 'dark' ? '☀️' : '🌙';
        });
        document.body.appendChild(btn);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggle);
    } else {
        createToggle();
    }
})();
