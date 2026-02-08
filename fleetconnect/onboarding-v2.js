/**
 * FleetConnect Enhanced Onboarding v2
 * Interactive step-by-step guided tour with spotlight effect
 * Include via: <script src="onboarding-v2.js"></script>
 */

class FleetConnectOnboardingV2 {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.isVisible = false;
        this.user = null;
        this.storageKey = null;
        this.roleStorageKey = null;
        this.overlayElement = null;
        this.spotlightElement = null;
        this.tooltipElement = null;

        this.init();
    }

    /**
     * Initialize the onboarding system
     */
    init() {
        this.user = this.getCurrentUser();

        if (this.user && this.user.id) {
            this.storageKey = `fleetconnect_onboarding_v2_${this.user.id}_seen`;
            this.roleStorageKey = `fleetconnect_onboarding_v2_${this.user.id}_role`;
        } else {
            this.storageKey = 'fc_onboarding_v2_complete';
            this.roleStorageKey = 'fc_onboarding_v2_role';
        }

        if (this.user && this.user.role) {
            this.setupSteps(this.user.role);
        }

        this.injectStyles();

        if (this.shouldAutoShow()) {
            setTimeout(() => this.show(), 800);
        }

        window.showOnboardingV2 = () => this.show();
        window.restartOnboarding = () => this.restart();
    }

    /**
     * Get current user from session/local storage
     */
    getCurrentUser() {
        try {
            const user = sessionStorage.getItem('fc_user') || localStorage.getItem('fc_user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            console.error('Error parsing user:', e);
            return null;
        }
    }

    /**
     * Check if onboarding should auto-show
     */
    shouldAutoShow() {
        if (!this.user) return false;
        if (!this.storageKey) return false;
        const hasSeenOnboarding = localStorage.getItem(this.storageKey) === 'true';
        return !hasSeenOnboarding;
    }

    /**
     * Setup steps based on user role
     */
    setupSteps(role) {
        const roleSteps = {
            admin: [
                {
                    title: 'Welcome to FleetConnect Admin!',
                    description: 'System administration dashboard for managing all platform users, companies, and operations. Let\'s get you started.',
                    target: null,
                    position: 'center'
                },
                {
                    title: 'Dashboard Stats',
                    description: 'View key metrics including active users, total jobs, and system health at a glance.',
                    target: '.header',
                    position: 'bottom'
                },
                {
                    title: 'User Management',
                    description: 'Add, edit, and remove users. Assign roles (admin, vendor, fieldworker, rental) and manage company access.',
                    target: '.admin-users-section',
                    position: 'right'
                },
                {
                    title: 'Feature Flags',
                    description: 'Control feature availability for different roles and companies. Enable or disable features in real-time.',
                    target: '.admin-features-section',
                    position: 'right'
                },
                {
                    title: 'Analytics & Monitoring',
                    description: 'Monitor platform usage, track all work orders, invoices, and documents across the system.',
                    target: '.admin-analytics-section',
                    position: 'right'
                },
                {
                    title: 'System Settings',
                    description: 'Configure system preferences, integrations, and platform-wide settings.',
                    target: '.admin-settings-section',
                    position: 'right'
                }
            ],
            vendor: [
                {
                    title: 'Welcome to FleetConnect Vendor!',
                    description: 'Your dispatch and management hub for coordinating field work and managing operations efficiently.',
                    target: null,
                    position: 'center'
                },
                {
                    title: 'Dashboard Stats',
                    description: 'Track active jobs, fuel delivered, and pending workers at a glance.',
                    target: '.stats-grid',
                    position: 'bottom'
                },
                {
                    title: 'Accept & Manage Jobs',
                    description: 'Review incoming work orders from rental companies. Accept jobs you can handle or decline if busy.',
                    target: '.table-card',
                    position: 'top'
                },
                {
                    title: 'Assign Field Workers',
                    description: 'Once you accept a job, assign it to your field team. Track who\'s working on what in real-time.',
                    target: '[onclick*="assignWorker"]',
                    position: 'right'
                },
                {
                    title: 'Track Invoices',
                    description: 'View and match invoices with fuel deliveries. Keep everything organized and auditable with QuickBooks integration.',
                    target: '[href*="invoices"]',
                    position: 'right'
                },
                {
                    title: 'Document Storage',
                    description: 'Store contracts, permits, safety certificates and other job-related documents in one secure location.',
                    target: '[href*="document"]',
                    position: 'right'
                }
            ],
            rental: [
                {
                    title: 'Welcome to FleetConnect Rental!',
                    description: 'Your complete fleet management and rental coordination platform. Track jobs and fuel deliveries in real-time.',
                    target: null,
                    position: 'center'
                },
                {
                    title: 'Dashboard Overview',
                    description: 'See active orders, pending jobs, and total gallons delivered this month.',
                    target: '.stats-grid',
                    position: 'bottom'
                },
                {
                    title: 'Create Work Orders',
                    description: 'Click Create Work Order to add new jobs. You can even scan rental documents with AI to auto-fill details.',
                    target: '.quick-action-btn.primary',
                    position: 'bottom'
                },
                {
                    title: 'AI Document Scan',
                    description: 'Upload rental agreements or purchase orders. Our AI automatically extracts job details for quick entry.',
                    target: '[onclick*="scanDocument"]',
                    position: 'right'
                },
                {
                    title: 'Track Deliveries',
                    description: 'Monitor fuel deliveries in real-time. See vendor progress, gallons delivered, and delivery timestamps.',
                    target: '[href*="work-orders"]',
                    position: 'right'
                },
                {
                    title: 'View Invoices',
                    description: 'Track all invoices from vendors. Export reports for accounting and billing.',
                    target: '[href*="invoices"]',
                    position: 'right'
                }
            ],
            fieldworker: [
                {
                    title: 'Welcome to FleetConnect Mobile!',
                    description: 'Your field job management tool for completing work and reporting deliveries on the go.',
                    target: null,
                    position: 'center'
                },
                {
                    title: 'My Jobs List',
                    description: 'See all jobs assigned to you with locations, contacts, equipment details, and special instructions.',
                    target: '.job-card',
                    position: 'right'
                },
                {
                    title: 'Job Details',
                    description: 'Tap any job to see full details: equipment numbers, fuel types, customer contact, and location.',
                    target: '.job-header',
                    position: 'right'
                },
                {
                    title: 'Create Invoice',
                    description: 'Tap Create Invoice, select equipment units, enter fuel gallons, and capture GPS location.',
                    target: '[onclick*="createInvoice"]',
                    position: 'bottom'
                },
                {
                    title: 'Capture Signature',
                    description: 'Get customer signature to verify delivery. Signatures are securely stored and auditable.',
                    target: '.signature-section',
                    position: 'top'
                },
                {
                    title: 'Attach Photos',
                    description: 'Take photos of equipment, delivery, or any issues. Photos are timestamped and geotagged.',
                    target: '[onclick*="attachPhotos"]',
                    position: 'top'
                },
                {
                    title: 'Report Incidents',
                    description: 'If anything goes wrong, tap Incident Report to document the issue with photos and detailed notes.',
                    target: '.incident-toggle',
                    position: 'right'
                }
            ]
        };

        this.steps = roleSteps[this.user?.role] || roleSteps.vendor;
    }

    /**
     * Inject CSS styles into the page
     */
    injectStyles() {
        if (document.getElementById('fc-onboarding-v2-styles')) return;

        const style = document.createElement('style');
        style.id = 'fc-onboarding-v2-styles';
        style.textContent = `
            .fc-onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                z-index: 9998;
                animation: fc-fade-in-v2 0.3s ease-out forwards;
            }

            @keyframes fc-fade-in-v2 {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .fc-onboarding-spotlight {
                position: fixed;
                border: 2px solid #60a5fa;
                border-radius: 12px;
                box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.3), inset 0 0 0 2px #60a5fa;
                animation: fc-pulse-v2 2s infinite;
                z-index: 9999;
            }

            @keyframes fc-pulse-v2 {
                0%, 100% { box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.3), inset 0 0 0 2px #60a5fa; }
                50% { box-shadow: 0 0 0 8px rgba(96, 165, 250, 0.2), inset 0 0 0 2px #60a5fa; }
            }

            .fc-onboarding-tooltip {
                position: fixed;
                background: #1a1a1a;
                color: #f5f0e8;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 20px;
                max-width: 380px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
                z-index: 10000;
                animation: fc-slide-in-v2 0.3s ease-out forwards;
            }

            body.dark .fc-onboarding-tooltip {
                background: #f5f0e8;
                color: #1a1a1a;
                border-color: #e8e4dc;
            }

            @keyframes fc-slide-in-v2 {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            .fc-onboarding-tooltip-arrow {
                position: absolute;
                width: 12px;
                height: 12px;
                background: #1a1a1a;
                border: 1px solid #333;
                transform: rotate(45deg);
                border-top: none;
                border-left: none;
            }

            body.dark .fc-onboarding-tooltip-arrow {
                background: #f5f0e8;
                border-color: #e8e4dc;
            }

            .fc-onboarding-tooltip.arrow-top .fc-onboarding-tooltip-arrow {
                bottom: -7px;
                left: 20px;
            }

            .fc-onboarding-tooltip.arrow-bottom .fc-onboarding-tooltip-arrow {
                top: -7px;
                left: 20px;
            }

            .fc-onboarding-tooltip.arrow-left .fc-onboarding-tooltip-arrow {
                right: -7px;
                top: 20px;
            }

            .fc-onboarding-tooltip.arrow-right .fc-onboarding-tooltip-arrow {
                left: -7px;
                top: 20px;
            }

            .fc-onboarding-title {
                font-size: 1.1rem;
                font-weight: 600;
                margin-bottom: 8px;
                color: inherit;
            }

            .fc-onboarding-description {
                font-size: 0.85rem;
                line-height: 1.5;
                color: inherit;
                opacity: 0.9;
                margin-bottom: 16px;
            }

            .fc-onboarding-progress {
                display: flex;
                gap: 6px;
                margin-bottom: 16px;
            }

            .fc-progress-dot-v2 {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #444;
                transition: all 0.3s ease;
            }

            body.dark .fc-progress-dot-v2 {
                background: #ddd;
            }

            .fc-progress-dot-v2.active {
                background: #60a5fa;
                width: 20px;
                border-radius: 3px;
            }

            .fc-progress-dot-v2.completed {
                background: #22c55e;
            }

            .fc-onboarding-buttons-v2 {
                display: flex;
                gap: 8px;
                justify-content: space-between;
            }

            .fc-onboarding-btn-v2 {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .fc-onboarding-btn-primary-v2 {
                background: #60a5fa;
                color: #1a1a1a;
            }

            .fc-onboarding-btn-primary-v2:hover {
                background: #7cb3f8;
                transform: translateY(-1px);
            }

            .fc-onboarding-btn-secondary-v2 {
                background: #333;
                color: #f5f0e8;
                border: 1px solid #555;
            }

            body.dark .fc-onboarding-btn-secondary-v2 {
                background: #f0ebe3;
                color: #1a1a1a;
                border-color: #ddd;
            }

            .fc-onboarding-btn-secondary-v2:hover {
                background: #444;
                transform: translateY(-1px);
            }

            body.dark .fc-onboarding-btn-secondary-v2:hover {
                background: #e8e4dc;
            }

            .fc-onboarding-btn-skip-v2 {
                background: transparent;
                color: #888;
                border: none;
                padding: 4px 8px;
                font-size: 0.7rem;
                text-transform: lowercase;
                letter-spacing: 0;
            }

            .fc-onboarding-btn-skip-v2:hover {
                color: #bbb;
            }

            .fc-onboarding-btn-v2:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .fc-step-indicator {
                font-size: 0.75rem;
                color: #888;
                margin-top: 8px;
                text-align: center;
            }

            body.dark .fc-step-indicator {
                color: #666;
            }

            /* Keyboard hints */
            .fc-keyboard-hint {
                font-size: 0.65rem;
                color: #666;
                margin-top: 8px;
                text-align: center;
            }

            body.dark .fc-keyboard-hint {
                color: #999;
            }

            @media (max-width: 768px) {
                .fc-onboarding-tooltip {
                    max-width: 85vw;
                    padding: 16px;
                }

                .fc-onboarding-title {
                    font-size: 1rem;
                }

                .fc-onboarding-description {
                    font-size: 0.8rem;
                }

                .fc-onboarding-btn-v2 {
                    padding: 8px 12px;
                    font-size: 0.75rem;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Show the onboarding tour
     */
    show() {
        this.user = this.getCurrentUser();
        if (!this.user) {
            console.warn('No user found for onboarding');
            return;
        }

        this.currentStep = 0;
        this.isVisible = true;
        this.render();
        this.attachKeyboardListeners();
    }

    /**
     * Restart the tour from beginning
     */
    restart() {
        localStorage.removeItem(this.storageKey);
        this.show();
    }

    /**
     * Hide the onboarding overlay
     */
    hide() {
        this.removeKeyboardListeners();
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = null;
        }
        if (this.spotlightElement) {
            this.spotlightElement.remove();
            this.spotlightElement = null;
        }
        if (this.tooltipElement) {
            this.tooltipElement.remove();
            this.tooltipElement = null;
        }
        this.isVisible = false;
    }

    /**
     * Mark onboarding as complete
     */
    complete() {
        if (this.storageKey) {
            localStorage.setItem(this.storageKey, 'true');
        }
        this.hide();
    }

    /**
     * Next step
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.render();
        } else {
            this.complete();
        }
    }

    /**
     * Previous step
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    }

    /**
     * Render the current step
     */
    render() {
        const step = this.steps[this.currentStep];
        if (!step) return;

        // Create overlay
        if (!this.overlayElement) {
            this.overlayElement = document.createElement('div');
            this.overlayElement.className = 'fc-onboarding-overlay';
            document.body.appendChild(this.overlayElement);
        }

        // Handle spotlight
        if (step.target) {
            this.createSpotlight(step.target);
        } else {
            if (this.spotlightElement) {
                this.spotlightElement.remove();
                this.spotlightElement = null;
            }
        }

        // Create tooltip
        this.createTooltip(step);
    }

    /**
     * Create spotlight effect around target element
     */
    createSpotlight(selector) {
        const target = document.querySelector(selector);
        if (!target) return;

        if (this.spotlightElement) {
            this.spotlightElement.remove();
        }

        this.spotlightElement = document.createElement('div');
        this.spotlightElement.className = 'fc-onboarding-spotlight';
        document.body.appendChild(this.spotlightElement);

        const rect = target.getBoundingClientRect();
        this.spotlightElement.style.left = (rect.left - 8) + 'px';
        this.spotlightElement.style.top = (rect.top - 8) + 'px';
        this.spotlightElement.style.width = (rect.width + 16) + 'px';
        this.spotlightElement.style.height = (rect.height + 16) + 'px';

        // Scroll into view
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Create tooltip with step info
     */
    createTooltip(step) {
        if (this.tooltipElement) {
            this.tooltipElement.remove();
        }

        this.tooltipElement = document.createElement('div');
        this.tooltipElement.className = 'fc-onboarding-tooltip';
        this.tooltipElement.innerHTML = `
            <div class="fc-onboarding-title">${step.title}</div>
            <div class="fc-onboarding-description">${step.description}</div>
            <div class="fc-onboarding-progress">
                ${this.steps.map((_, i) => `
                    <div class="fc-progress-dot-v2 ${i < this.currentStep ? 'completed' : ''} ${i === this.currentStep ? 'active' : ''}"></div>
                `).join('')}
            </div>
            <div class="fc-step-indicator">Step ${this.currentStep + 1} of ${this.steps.length}</div>
            <div class="fc-onboarding-buttons-v2">
                <button class="fc-onboarding-btn-v2 fc-onboarding-btn-skip-v2" onclick="window.fleetConnectOnboardingV2.complete()">Skip Tour</button>
                <div>
                    <button class="fc-onboarding-btn-v2 fc-onboarding-btn-secondary-v2" ${this.currentStep === 0 ? 'disabled' : ''} onclick="window.fleetConnectOnboardingV2.prevStep()">← Prev</button>
                    <button class="fc-onboarding-btn-v2 fc-onboarding-btn-primary-v2" onclick="window.fleetConnectOnboardingV2.nextStep()" style="margin-left:6px;">${this.currentStep === this.steps.length - 1 ? 'Done!' : 'Next →'}</button>
                </div>
            </div>
            <div class="fc-keyboard-hint">Press → / ← or ESC</div>
            <div class="fc-onboarding-tooltip-arrow"></div>
        `;

        document.body.appendChild(this.tooltipElement);

        // Position tooltip
        if (step.target) {
            const target = document.querySelector(step.target);
            if (target) {
                this.positionTooltip(target, step.position);
            }
        } else {
            // Center tooltip for welcome screen
            this.tooltipElement.style.top = '50%';
            this.tooltipElement.style.left = '50%';
            this.tooltipElement.style.transform = 'translate(-50%, -50%)';
        }
    }

    /**
     * Position tooltip relative to target element
     */
    positionTooltip(target, position) {
        const rect = target.getBoundingClientRect();
        const tooltip = this.tooltipElement;
        const gap = 16;

        const positions = {
            top: {
                left: rect.left + rect.width / 2 - tooltip.offsetWidth / 2,
                top: rect.top - tooltip.offsetHeight - gap,
                arrow: 'arrow-bottom'
            },
            bottom: {
                left: rect.left + rect.width / 2 - tooltip.offsetWidth / 2,
                top: rect.bottom + gap,
                arrow: 'arrow-top'
            },
            left: {
                left: rect.left - tooltip.offsetWidth - gap,
                top: rect.top + rect.height / 2 - tooltip.offsetHeight / 2,
                arrow: 'arrow-right'
            },
            right: {
                left: rect.right + gap,
                top: rect.top + rect.height / 2 - tooltip.offsetHeight / 2,
                arrow: 'arrow-left'
            },
            center: {
                left: window.innerWidth / 2 - tooltip.offsetWidth / 2,
                top: window.innerHeight / 2 - tooltip.offsetHeight / 2,
                arrow: 'arrow-top'
            }
        };

        const pos = positions[position] || positions.right;

        tooltip.style.left = Math.max(10, Math.min(pos.left, window.innerWidth - tooltip.offsetWidth - 10)) + 'px';
        tooltip.style.top = Math.max(10, Math.min(pos.top, window.innerHeight - tooltip.offsetHeight - 10)) + 'px';
        tooltip.classList.add(pos.arrow);
    }

    /**
     * Attach keyboard listeners
     */
    attachKeyboardListeners() {
        this.keyboardHandler = (e) => {
            if (!this.isVisible) return;

            switch (e.key) {
                case 'ArrowRight':
                case ' ':
                    e.preventDefault();
                    this.nextStep();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevStep();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.complete();
                    break;
            }
        };

        document.addEventListener('keydown', this.keyboardHandler);
    }

    /**
     * Remove keyboard listeners
     */
    removeKeyboardListeners() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
        }
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.fleetConnectOnboardingV2 = new FleetConnectOnboardingV2();
    });
} else {
    window.fleetConnectOnboardingV2 = new FleetConnectOnboardingV2();
}
