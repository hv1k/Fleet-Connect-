/**
 * FleetConnect Theme Manager
 * Universal dark/light mode manager with localStorage persistence
 * and system preference detection.
 *
 * Usage:
 *   - Include in HTML: <script src="theme-manager.js"></script>
 *   - Automatically initializes on page load
 *   - Call ThemeManager.toggle() to switch themes
 *   - Listen to 'themechange' events for custom logic
 */

window.ThemeManager = (() => {
    const STORAGE_KEY = 'fleetconnect-theme';
    const DARK_CLASS = 'theme-dark';
    const LIGHT_CLASS = 'theme-light';

    // CSS variables for both themes
    const THEME_STYLES = `
        :root {
            --transition-theme: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
        }

        /* Dark theme (default) */
        body.theme-dark {
            --bg-deep: #06060b;
            --bg-dark: #0a0a12;
            --bg-card: #0f0f1a;
            --bg-surface: #161625;
            --text-primary: #f0f0f5;
            --text-secondary: #8888aa;
            --border: #1e1e35;
            --accent: #60a5fa;
            --bg-page: #06060b;
        }

        /* Light theme */
        body.theme-light {
            --bg-deep: #f5f5f5;
            --bg-dark: #ffffff;
            --bg-card: #ffffff;
            --bg-surface: #f0f0f0;
            --text-primary: #1a1a2e;
            --text-secondary: #666688;
            --border: #ddddee;
            --accent: #2563eb;
            --bg-page: #f5f5f5;
        }

        /* Smooth transitions */
        body, body * {
            transition: var(--transition-theme);
        }

        /* Theme toggle button styles */
        .theme-toggle-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            width: 44px;
            height: 44px;
            border-radius: 10px;
            border: 1px solid var(--border);
            background: var(--bg-card);
            color: var(--accent);
            font-size: 1.2rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }

        .theme-toggle-btn:hover {
            background: var(--bg-surface);
            transform: scale(1.05);
        }

        .theme-toggle-btn:active {
            transform: scale(0.95);
        }

        /* Toast notification styles */
        .theme-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            background: var(--accent);
            color: var(--bg-deep);
            font-size: 0.85rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideUp 0.3s ease;
            z-index: 999;
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .theme-toast.fadeout {
            animation: slideDown 0.3s ease forwards;
        }

        @keyframes slideDown {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(20px);
            }
        }
    `;

    // State
    let currentTheme = 'dark';
    let toggleButton = null;

    /**
     * Inject CSS styles into the document
     */
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = THEME_STYLES;
        document.head.appendChild(style);
    }

    /**
     * Detect system preference (prefers-color-scheme media query)
     */
    function getSystemPreference() {
        if (!window.matchMedia) return 'dark';
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    /**
     * Get saved theme from localStorage or system preference
     */
    function getSavedTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
            return saved;
        }
        return getSystemPreference();
    }

    /**
     * Apply theme to DOM
     */
    function applyTheme(theme) {
        const isDark = theme === 'dark';
        document.body.classList.remove(DARK_CLASS, LIGHT_CLASS);
        document.body.classList.add(isDark ? DARK_CLASS : LIGHT_CLASS);
        currentTheme = theme;
        localStorage.setItem(STORAGE_KEY, theme);

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme, isDark }
        }));
    }

    /**
     * Create and insert theme toggle button
     */
    function createToggleButton() {
        const btn = document.createElement('button');
        btn.className = 'theme-toggle-btn';
        btn.setAttribute('aria-label', 'Toggle theme');
        btn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
        btn.onclick = () => {
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            toggle();
            updateToggleButton();
        };

        document.body.appendChild(btn);
        return btn;
    }

    /**
     * Update toggle button appearance
     */
    function updateToggleButton() {
        if (toggleButton) {
            toggleButton.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    }

    /**
     * Show toast notification
     */
    function showToast(message) {
        const existing = document.querySelector('.theme-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'theme-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fadeout');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    return {
        /**
         * Initialize theme manager (called automatically on load)
         */
        init() {
            injectStyles();
            currentTheme = getSavedTheme();
            applyTheme(currentTheme);
            toggleButton = createToggleButton();

            // Listen for system theme changes
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
                    if (!localStorage.getItem(STORAGE_KEY)) {
                        applyTheme(e.matches ? 'light' : 'dark');
                    }
                });
            }
        },

        /**
         * Toggle between dark and light theme
         */
        toggle() {
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        /**
         * Set theme explicitly
         * @param {string} theme - 'dark' or 'light'
         */
        setTheme(theme) {
            if (theme !== 'dark' && theme !== 'light') {
                console.warn('Invalid theme:', theme);
                return;
            }
            applyTheme(theme);
            updateToggleButton();
            showToast(`Switched to ${theme} mode`);
        },

        /**
         * Get current theme
         * @returns {string} 'dark' or 'light'
         */
        getTheme() {
            return currentTheme;
        },

        /**
         * Check if dark mode is active
         * @returns {boolean}
         */
        isDark() {
            return currentTheme === 'dark';
        },

        /**
         * Check if light mode is active
         * @returns {boolean}
         */
        isLight() {
            return currentTheme === 'light';
        }
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ThemeManager.init();
    });
} else {
    ThemeManager.init();
}
