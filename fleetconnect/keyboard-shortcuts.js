/**
 * FleetConnect Keyboard Shortcuts Manager
 * Global keyboard shortcut handler with shortcuts panel overlay.
 *
 * Features:
 *   - Two-key sequences (vim-style: 'g' then second key within 500ms)
 *   - Single-key shortcuts (/, Escape, ?)
 *   - Modal overlay showing available shortcuts (press ?)
 *   - Toast notifications for shortcut actions
 *   - Feature flag controlled: keyboard_shortcuts
 *   - Role-based activation (admin/vendor only, not field workers)
 *
 * Usage:
 *   - Include in HTML: <script src="keyboard-shortcuts.js"></script>
 *   - Automatically initializes after page load
 */

window.KeyboardShortcuts = (() => {
    // Shortcut definitions
    const SHORTCUTS = {
        navigation: [
            { keys: 'g d', label: 'Go to Dashboard', action: 'goToDashboard' },
            { keys: 'g j', label: 'Go to Jobs/Work Orders', action: 'goToJobs' },
            { keys: 'g i', label: 'Go to Invoices', action: 'goToInvoices' },
            { keys: 'g s', label: 'Go to Settings', action: 'goToSettings' },
            { keys: 'g c', label: 'Go to Chat', action: 'goToChat' },
            { keys: 'g a', label: 'Go to Analytics (Admin)', action: 'goToAnalytics' }
        ],
        actions: [
            { keys: '/ or Ctrl+K', label: 'Focus search bar', action: 'focusSearch' },
            { keys: 'n', label: 'New (create job/invoice)', action: 'newItem' },
            { keys: 'Escape', label: 'Close modal/overlay', action: 'closeModal' },
            { keys: '?', label: 'Show shortcuts panel', action: 'showPanel' }
        ]
    };

    // Navigation routes by role
    const ROUTES = {
        admin: {
            dashboard: 'admin-dashboard.html',
            jobs: 'work-orders.html',
            invoices: 'admin-dashboard.html',
            settings: 'settings.html',
            chat: 'chat.html',
            analytics: 'analytics.html',
            create: 'create-job.html'
        },
        vendor: {
            dashboard: 'vendor-dashboard.html',
            jobs: 'work-orders.html',
            invoices: 'invoices.html',
            settings: 'settings.html',
            chat: 'chat.html',
            analytics: null,
            create: 'create-job.html'
        },
        fieldworker: {
            dashboard: 'field-worker.html',
            jobs: 'work-orders.html',
            invoices: null,
            settings: 'settings.html',
            chat: 'chat.html',
            analytics: null,
            create: null
        }
    };

    // State
    let isEnabled = false;
    let userRole = 'vendor';
    let lastKeyTime = 0;
    let lastKey = null;
    let panelOpen = false;

    // Styles for shortcuts panel
    const PANEL_STYLES = `
        .shortcuts-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            align-items: center;
            justify-content: center;
            padding: 20px;
            animation: fadeIn 0.2s ease;
        }

        .shortcuts-overlay.show {
            display: flex;
        }

        .shortcuts-panel {
            background: var(--bg-card, #242424);
            border-radius: 16px;
            max-width: 500px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid var(--border, #333);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        }

        .shortcuts-header {
            padding: 24px;
            border-bottom: 1px solid var(--border, #333);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            background: var(--bg-card, #242424);
        }

        .shortcuts-title {
            font-size: 1.3rem;
            font-weight: 700;
            color: var(--text-primary, #f5f0e8);
        }

        .shortcuts-close {
            background: none;
            border: none;
            font-size: 1.8rem;
            cursor: pointer;
            color: var(--text-secondary, #888);
            transition: color 0.2s;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .shortcuts-close:hover {
            color: var(--text-primary, #f5f0e8);
        }

        .shortcuts-category {
            padding: 20px 24px;
        }

        .shortcuts-category:not(:last-child) {
            border-bottom: 1px solid var(--border, #333);
        }

        .shortcuts-category-title {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-secondary, #888);
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }

        .shortcuts-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            gap: 16px;
        }

        .shortcuts-keys {
            font-family: monospace;
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--accent, #60a5fa);
            background: rgba(96, 165, 250, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            white-space: nowrap;
        }

        .shortcuts-label {
            font-size: 0.85rem;
            color: var(--text-primary, #f5f0e8);
            flex: 1;
        }

        .shortcuts-hint {
            text-align: center;
            padding: 16px;
            font-size: 0.8rem;
            color: var(--text-secondary, #888);
            border-top: 1px solid var(--border, #333);
        }

        /* Toast styles */
        .shortcuts-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            background: var(--accent, #60a5fa);
            color: var(--bg-deep, #1a1a1a);
            font-size: 0.85rem;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideUp 0.3s ease;
            z-index: 9999;
        }

        .shortcuts-hint-badge {
            position: fixed;
            bottom: 20px;
            left: 20px;
            font-size: 0.75rem;
            color: var(--text-secondary, #888);
            z-index: 50;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    /**
     * Inject styles into the document
     */
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = PANEL_STYLES;
        document.head.appendChild(style);
    }

    /**
     * Detect user role from page or auth
     */
    function detectUserRole() {
        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            if (user && user.role) {
                userRole = user.role;
                return user.role;
            }
        }
        // Fallback: check page URL
        const page = window.location.pathname;
        if (page.includes('admin')) return 'admin';
        if (page.includes('vendor')) return 'vendor';
        if (page.includes('field-worker')) return 'fieldworker';
        return 'vendor';
    }

    /**
     * Check if shortcuts should be active for this role
     */
    function isRoleEnabled() {
        // Only admin and vendor roles support keyboard shortcuts
        return userRole === 'admin' || userRole === 'vendor';
    }

    /**
     * Check if feature flag is enabled
     */
    function isFlagEnabled() {
        if (typeof FC_FLAGS !== 'undefined' && FC_FLAGS.isOn) {
            return FC_FLAGS.isOn('keyboard_shortcuts');
        }
        return true; // Default to enabled if no flags available
    }

    /**
     * Show toast notification
     */
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'shortcuts-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    /**
     * Navigate to route
     */
    function navigateTo(route) {
        const routes = ROUTES[userRole] || ROUTES.vendor;
        if (routes[route]) {
            window.location.href = routes[route];
        }
    }

    /**
     * Focus search input on page
     */
    function focusSearch() {
        const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search"], input[placeholder*="search"], input[id*="search"]');
        if (searchInputs.length > 0) {
            searchInputs[0].focus();
            showToast('Search focused');
            return true;
        }
        return false;
    }

    /**
     * Handle new item creation
     */
    function createNewItem() {
        const createBtn = document.querySelector('[onclick*="create"], [onclick*="new"]');
        if (createBtn) {
            createBtn.click();
            showToast('Creating new item...');
            return true;
        }
        return false;
    }

    /**
     * Close any open modals
     */
    function closeAnyModal() {
        // Close custom modal overlays
        document.querySelectorAll('.modal-overlay.show, [role="dialog"]').forEach(modal => {
            modal.classList.remove('show');
            if (modal.style.display !== 'none') modal.style.display = 'none';
        });

        // Close shortcuts panel
        if (panelOpen) {
            closePanel();
            return;
        }

        showToast('Modal closed');
    }

    /**
     * Create and render shortcuts panel
     */
    function createPanel() {
        const overlay = document.createElement('div');
        overlay.className = 'shortcuts-overlay';
        overlay.id = 'shortcutsOverlay';

        const panel = document.createElement('div');
        panel.className = 'shortcuts-panel';

        // Header
        const header = document.createElement('div');
        header.className = 'shortcuts-header';
        header.innerHTML = `
            <div class="shortcuts-title">Keyboard Shortcuts</div>
            <button class="shortcuts-close" onclick="KeyboardShortcuts.closePanel()">×</button>
        `;

        panel.appendChild(header);

        // Categories
        Object.entries(SHORTCUTS).forEach(([category, items]) => {
            const catDiv = document.createElement('div');
            catDiv.className = 'shortcuts-category';

            const title = document.createElement('div');
            title.className = 'shortcuts-category-title';
            title.textContent = category;

            catDiv.appendChild(title);

            items.forEach(item => {
                // Hide admin-only shortcuts for non-admin
                if (item.action === 'goToAnalytics' && userRole !== 'admin') {
                    return;
                }

                const itemDiv = document.createElement('div');
                itemDiv.className = 'shortcuts-item';

                const keys = document.createElement('div');
                keys.className = 'shortcuts-keys';
                keys.textContent = item.keys;

                const label = document.createElement('div');
                label.className = 'shortcuts-label';
                label.textContent = item.label;

                itemDiv.appendChild(keys);
                itemDiv.appendChild(label);
                catDiv.appendChild(itemDiv);
            });

            panel.appendChild(catDiv);
        });

        // Hint
        const hint = document.createElement('div');
        hint.className = 'shortcuts-hint';
        hint.textContent = 'Press ? anytime to show this panel • Press Escape to close';

        panel.appendChild(hint);
        overlay.appendChild(panel);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closePanel();
            }
        });

        document.body.appendChild(overlay);
    }

    /**
     * Open shortcuts panel
     */
    function openPanel() {
        let overlay = document.getElementById('shortcutsOverlay');
        if (!overlay) {
            createPanel();
            overlay = document.getElementById('shortcutsOverlay');
        }
        overlay.classList.add('show');
        panelOpen = true;
    }

    /**
     * Close shortcuts panel
     */
    function closePanel() {
        const overlay = document.getElementById('shortcutsOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
        panelOpen = false;
    }

    /**
     * Handle two-key sequences
     */
    function handleTwoKeySequence(key) {
        const now = Date.now();
        const timeSinceLastKey = now - lastKeyTime;

        if (key === 'g') {
            lastKey = 'g';
            lastKeyTime = now;
            return;
        }

        if (lastKey === 'g' && timeSinceLastKey < 500) {
            lastKey = null;
            lastKeyTime = 0;

            switch (key) {
                case 'd':
                    showToast('Navigating to Dashboard...');
                    navigateTo('dashboard');
                    return true;
                case 'j':
                    showToast('Navigating to Jobs...');
                    navigateTo('jobs');
                    return true;
                case 'i':
                    showToast('Navigating to Invoices...');
                    navigateTo('invoices');
                    return true;
                case 's':
                    showToast('Navigating to Settings...');
                    navigateTo('settings');
                    return true;
                case 'c':
                    showToast('Navigating to Chat...');
                    navigateTo('chat');
                    return true;
                case 'a':
                    if (userRole === 'admin') {
                        showToast('Navigating to Analytics...');
                        navigateTo('analytics');
                        return true;
                    }
                    break;
            }
        }

        lastKey = null;
        lastKeyTime = 0;
        return false;
    }

    /**
     * Global keyboard event handler
     */
    function handleKeyDown(e) {
        if (!isEnabled) return;

        // Don't trigger if typing in input/textarea
        const isTyping = /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
        const isContentEditable = e.target.contentEditable === 'true';

        // Handle Escape (works even when typing in some contexts)
        if (e.key === 'Escape') {
            e.preventDefault();
            closeAnyModal();
            return;
        }

        if (isTyping || isContentEditable) {
            return;
        }

        // Handle ? for shortcuts panel
        if (e.key === '?') {
            e.preventDefault();
            openPanel();
            return;
        }

        // Handle / or Ctrl+K for search focus
        if (e.key === '/' || (e.ctrlKey && e.key === 'k') || (e.metaKey && e.key === 'k')) {
            e.preventDefault();
            if (!focusSearch()) {
                showToast('No search bar found on this page');
            }
            return;
        }

        // Handle n for new item (only if not typing)
        if (e.key === 'n' && !isTyping && !isContentEditable) {
            e.preventDefault();
            if (!createNewItem()) {
                showToast('No create button found on this page');
            }
            return;
        }

        // Handle two-key sequences (g + second key)
        const key = e.key.toLowerCase();
        if (handleTwoKeySequence(key)) {
            e.preventDefault();
        }
    }

    /**
     * Create hint badge at bottom
     */
    function createHintBadge() {
        const badge = document.createElement('div');
        badge.className = 'shortcuts-hint-badge';
        badge.textContent = 'Press ? for shortcuts';
        document.body.appendChild(badge);
    }

    return {
        /**
         * Initialize keyboard shortcuts manager
         */
        init() {
            userRole = detectUserRole();

            // Check if should be enabled
            if (!isRoleEnabled() || !isFlagEnabled()) {
                return;
            }

            injectStyles();
            createHintBadge();
            isEnabled = true;

            // Add event listener
            document.addEventListener('keydown', handleKeyDown);
        },

        /**
         * Close shortcuts panel (exposed for HTML onclick)
         */
        closePanel() {
            closePanel();
        },

        /**
         * Toggle shortcuts on/off
         */
        setEnabled(enabled) {
            isEnabled = enabled;
        },

        /**
         * Check if shortcuts are enabled
         */
        isEnabled() {
            return isEnabled;
        }
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        KeyboardShortcuts.init();
    });
} else {
    KeyboardShortcuts.init();
}
