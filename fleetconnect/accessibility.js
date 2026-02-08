/**
 * FleetConnect Accessibility Manager (WCAG 2.1)
 * Provides screen reader support, ARIA labels, focus management,
 * and high-contrast mode across all pages.
 *
 * Features:
 *   - Auto ARIA labels for icon buttons and interactive elements
 *   - Focus trapping in modals
 *   - High-contrast mode toggle (Alt+H)
 *   - Skip-to-content links
 *   - Screen reader announcements
 *   - Focus ring styling
 *
 * Usage:
 *   - Include in HTML: <script src="accessibility.js"></script>
 *   - Automatically initializes on page load
 */

window.A11y = (() => {
    // Configuration
    const HIGH_CONTRAST_STORAGE_KEY = 'fleetconnect-high-contrast';
    const FOCUS_OUTLINE_CLASS = 'a11y-focus-visible';
    const HIGH_CONTRAST_CLASS = 'a11y-high-contrast';

    // Announce region for screen readers
    let announceRegion = null;

    // CSS for accessibility enhancements
    const A11Y_STYLES = `
        /* Skip to content link */
        .a11y-skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--accent, #60a5fa);
            color: white;
            padding: 8px 16px;
            border-radius: 0 0 8px 0;
            z-index: 10001;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .a11y-skip-link:focus {
            top: 0;
        }

        /* Focus ring styling */
        .a11y-focus-visible,
        button:focus-visible,
        input:focus-visible,
        select:focus-visible,
        textarea:focus-visible,
        a:focus-visible {
            outline: 2px solid var(--accent, #60a5fa) !important;
            outline-offset: 2px !important;
        }

        /* High contrast mode */
        body.a11y-high-contrast {
            --contrast-multiplier: 1.3;
            background: #000000 !important;
            color: #ffffff !important;
        }

        body.a11y-high-contrast,
        body.a11y-high-contrast * {
            background: #000000 !important;
            color: #ffffff !important;
            border-width: 2px !important;
        }

        body.a11y-high-contrast .modal-overlay {
            background: rgba(0, 0, 0, 0.95) !important;
        }

        body.a11y-high-contrast input,
        body.a11y-high-contrast textarea,
        body.a11y-high-contrast select {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 2px solid #ffffff !important;
        }

        body.a11y-high-contrast button {
            border: 2px solid #ffffff !important;
            color: #ffffff !important;
        }

        body.a11y-high-contrast a {
            color: #ffff00 !important;
            text-decoration: underline !important;
        }

        /* Screen reader only text */
        .a11y-sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }

        /* Announcement region */
        #a11yAnnouncements {
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        }

        #a11yAnnouncements[aria-live] {
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        }

        /* Focus management indicator */
        .a11y-modal-backdrop {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 199;
        }

        .a11y-modal-backdrop.active {
            display: block;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation: none !important;
                transition: none !important;
            }
        }
    `;

    let highContrastEnabled = false;

    /**
     * Inject accessibility styles
     */
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = A11Y_STYLES;
        document.head.appendChild(style);
    }

    /**
     * Create announcement region for screen reader
     */
    function createAnnounceRegion() {
        announceRegion = document.createElement('div');
        announceRegion.id = 'a11yAnnouncements';
        announceRegion.setAttribute('aria-live', 'polite');
        announceRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(announceRegion);
    }

    /**
     * Announce message to screen readers
     */
    function announce(message) {
        if (announceRegion) {
            announceRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                announceRegion.textContent = '';
            }, 1000);
        }
    }

    /**
     * Create skip-to-content link
     */
    function createSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'a11y-skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.tabIndex = 0;

        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const mainContent = document.querySelector('#main-content, [role="main"], main, .main, .content');
            if (mainContent) {
                mainContent.tabIndex = -1;
                mainContent.focus();
                announce('Navigated to main content');
            }
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    /**
     * Add ARIA labels to icon-only buttons
     */
    function addAriaLabels() {
        // Buttons with SVG or emoji only
        document.querySelectorAll('button:not([aria-label])').forEach(btn => {
            const text = btn.textContent.trim();
            const hasIcon = btn.querySelector('svg') || /^[\p{Emoji_Presentation}]$/u.test(btn.textContent);

            if (!text && hasIcon) {
                // Try to infer label from context
                const ariaLabel = inferButtonLabel(btn);
                if (ariaLabel) {
                    btn.setAttribute('aria-label', ariaLabel);
                }
            }
        });

        // Links with icon only
        document.querySelectorAll('a:not([aria-label])').forEach(link => {
            const text = link.textContent.trim();
            const hasIcon = link.querySelector('svg');

            if (!text && hasIcon && link.href) {
                const ariaLabel = link.title || link.getAttribute('data-label') || link.href.split('/').pop();
                if (ariaLabel) {
                    link.setAttribute('aria-label', ariaLabel);
                }
            }
        });

        // Images without alt text
        document.querySelectorAll('img:not([alt])').forEach(img => {
            const alt = img.getAttribute('data-alt') || img.title || 'Image';
            img.setAttribute('alt', alt);
        });
    }

    /**
     * Infer button label from context
     */
    function inferButtonLabel(btn) {
        // Common icon patterns
        const html = btn.innerHTML.toLowerCase();
        if (html.includes('search')) return 'Search';
        if (html.includes('close') || html.includes('×') || html.includes('&#215;')) return 'Close';
        if (html.includes('menu') || html.includes('☰')) return 'Menu';
        if (html.includes('heart')) return 'Like';
        if (html.includes('star')) return 'Star';
        if (html.includes('share')) return 'Share';
        if (html.includes('delete') || html.includes('trash')) return 'Delete';
        if (html.includes('edit') || html.includes('pencil')) return 'Edit';
        if (html.includes('download')) return 'Download';
        if (html.includes('upload')) return 'Upload';
        if (html.includes('filter')) return 'Filter';
        if (html.includes('sort')) return 'Sort';
        if (html.includes('more')) return 'More options';

        return null;
    }

    /**
     * Add semantic roles and ARIA attributes
     */
    function addSemanticRoles() {
        // Navigation sidebars
        document.querySelectorAll('.sidebar, [class*="nav"], nav').forEach(el => {
            if (!el.getAttribute('role')) {
                el.setAttribute('role', 'navigation');
            }
        });

        // Main content area
        const mainContent = document.querySelector('main, [class*="main"], [class*="content"]');
        if (mainContent && !mainContent.getAttribute('role')) {
            mainContent.setAttribute('role', 'main');
            mainContent.id = 'main-content';
        }

        // Dropdowns
        document.querySelectorAll('[class*="dropdown"], select').forEach(el => {
            if (!el.getAttribute('role')) {
                el.setAttribute('role', 'combobox');
            }
            el.setAttribute('aria-haspopup', 'listbox');
        });

        // Modals and overlays
        document.querySelectorAll('[class*="modal"], [class*="overlay"]').forEach(el => {
            if (!el.getAttribute('role')) {
                el.setAttribute('role', 'dialog');
            }
            el.setAttribute('aria-modal', 'true');
        });

        // Error messages
        document.querySelectorAll('[class*="error"], [class*="alert"]').forEach(el => {
            if (!el.getAttribute('role')) {
                el.setAttribute('role', 'alert');
            }
        });

        // Live regions for updates
        document.querySelectorAll('[class*="toast"], [class*="notification"]').forEach(el => {
            el.setAttribute('aria-live', 'polite');
            el.setAttribute('aria-atomic', 'true');
        });

        // Expandable/collapsible elements
        document.querySelectorAll('[class*="expand"], [class*="collapse"], [class*="toggle"]').forEach(el => {
            const isExpanded = el.classList.contains('active') || el.classList.contains('open');
            el.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        });
    }

    /**
     * Setup focus management for modals
     */
    function setupFocusManagement() {
        // Store modal stack
        const modalStack = [];

        document.addEventListener('click', (e) => {
            // Detect modal open
            if (e.target.classList.contains('modal-overlay') ||
                e.target.parentElement.classList.contains('modal-overlay')) {
                return;
            }

            // Check if opening a modal
            const modal = e.target.closest('[role="dialog"], .modal, .modal-overlay');
            if (modal && modal.classList.contains('show') && !modalStack.includes(modal)) {
                modalStack.push(modal);
                trapFocus(modal);
                announce('Modal opened');
            }
        });

        // Handle modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') ||
                e.target.closest('.modal-close')) {
                if (modalStack.length > 0) {
                    const modal = modalStack.pop();
                    restoreFocus(modal);
                    announce('Modal closed');
                }
            }
        });

        // Escape key closes modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalStack.length > 0) {
                const modal = modalStack[modalStack.length - 1];
                if (modal.classList.contains('show')) {
                    modal.classList.remove('show');
                    modalStack.pop();
                    if (modalStack.length > 0) {
                        trapFocus(modalStack[modalStack.length - 1]);
                    }
                    announce('Modal closed');
                }
            }
        });
    }

    /**
     * Trap focus inside modal
     */
    function trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        firstElement.focus();

        const handleKeyDown = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        modal.addEventListener('keydown', handleKeyDown);
        modal._focusTrapHandler = handleKeyDown;
    }

    /**
     * Restore focus after modal close
     */
    function restoreFocus(modal) {
        if (modal._focusTrapHandler) {
            modal.removeEventListener('keydown', modal._focusTrapHandler);
        }
    }

    /**
     * Toggle high-contrast mode
     */
    function toggleHighContrast() {
        highContrastEnabled = !highContrastEnabled;
        localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, highContrastEnabled ? 'true' : 'false');

        if (highContrastEnabled) {
            document.body.classList.add(HIGH_CONTRAST_CLASS);
            announce('High contrast mode enabled');
        } else {
            document.body.classList.remove(HIGH_CONTRAST_CLASS);
            announce('High contrast mode disabled');
        }
    }

    /**
     * Load high-contrast preference
     */
    function loadHighContrastPreference() {
        const saved = localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY);
        if (saved === 'true') {
            highContrastEnabled = true;
            document.body.classList.add(HIGH_CONTRAST_CLASS);
        }
    }

    /**
     * Setup keyboard shortcuts for accessibility
     */
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt+H for high-contrast toggle
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                toggleHighContrast();
            }
        });
    }

    /**
     * Enhance form validation announcements
     */
    function enhanceFormValidation() {
        document.addEventListener('invalid', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                const message = e.target.validationMessage || 'This field is invalid';
                e.target.setAttribute('aria-invalid', 'true');
                e.target.setAttribute('aria-describedby', 'error-' + e.target.id);

                // Create error description element if needed
                let errorEl = document.getElementById('error-' + e.target.id);
                if (!errorEl) {
                    errorEl = document.createElement('div');
                    errorEl.id = 'error-' + e.target.id;
                    errorEl.className = 'a11y-sr-only';
                    e.target.parentElement.appendChild(errorEl);
                }
                errorEl.textContent = message;
                announce('Error: ' + message);
            }
        }, true);

        // Clear error on input
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                e.target.setAttribute('aria-invalid', 'false');
            }
        });
    }

    /**
     * Announce page navigation
     */
    function announcePageNavigation() {
        const originalPush = window.history.pushState;
        window.history.pushState = function(...args) {
            originalPush.apply(window.history, args);
            const title = document.title;
            announce('Navigated to ' + title);
        };
    }

    return {
        /**
         * Initialize accessibility features
         */
        init() {
            injectStyles();
            createAnnounceRegion();
            createSkipLink();
            addAriaLabels();
            addSemanticRoles();
            setupFocusManagement();
            setupKeyboardShortcuts();
            enhanceFormValidation();
            announcePageNavigation();
            loadHighContrastPreference();
        },

        /**
         * Add ARIA labels to page elements
         */
        addAriaLabels() {
            addAriaLabels();
        },

        /**
         * Setup focus management for modals
         */
        setupFocusManagement() {
            setupFocusManagement();
        },

        /**
         * Toggle high-contrast mode
         */
        toggleHighContrast() {
            toggleHighContrast();
        },

        /**
         * Check if high-contrast is enabled
         */
        isHighContrastEnabled() {
            return highContrastEnabled;
        },

        /**
         * Announce message to screen readers
         */
        announce(message) {
            announce(message);
        },

        /**
         * Get current high-contrast state
         */
        getState() {
            return {
                highContrastEnabled,
                hasAnnounceRegion: !!announceRegion
            };
        }
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        A11y.init();
    });
} else {
    A11y.init();
}
