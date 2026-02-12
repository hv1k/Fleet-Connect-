/**
 * FleetConnect Onboarding Tutorial Component
 * A standalone, role-aware onboarding overlay system
 * Include via: <script src="onboarding.js"></script>
 */

class FleetConnectOnboarding {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.isVisible = false;
        this.overlayElement = null;
        this.user = null;
        // Storage keys are now per-user to prevent showing tutorial on every login
        this.storageKey = null; // Will be set in init() after user is fetched
        this.roleStorageKey = null;

        // Initialize immediately
        this.init();
    }

    /**
     * Initialize the onboarding system
     */
    init() {
        // Try to get current user
        this.user = this.getCurrentUser();

        // Setup per-user storage keys once we have the user
        if (this.user && this.user.id) {
            this.storageKey = `fleetconnect_onboarding_${this.user.id}_seen`;
            this.roleStorageKey = `fleetconnect_onboarding_${this.user.id}_role`;
        } else {
            // Fallback if no user ID
            this.storageKey = 'fc_onboarding_complete';
            this.roleStorageKey = 'fc_onboarding_role';
        }

        // Setup steps based on user role
        if (this.user && this.user.role) {
            this.setupSteps(this.user.role);
        }

        // Inject styles
        this.injectStyles();

        // Check if should auto-show on page load
        if (this.shouldAutoShow()) {
            setTimeout(() => this.show(), 500);
        }

        // Expose global method to trigger onboarding
        window.showOnboarding = () => this.show();
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

        // Only show if user hasn't seen it before
        const hasSeenOnboarding = localStorage.getItem(this.storageKey) === 'true';

        // Show if not seen before
        return !hasSeenOnboarding;
    }

    /**
     * Setup steps based on user role
     */
    setupSteps(role) {
        const roleSteps = {
            rental: [
                {
                    title: '👋 Welcome to FleetConnect!',
                    description: 'Your complete fleet management and rental coordination platform. Track jobs, fuel deliveries, and equipment in real-time.',
                    highlight: null
                },
                {
                    title: '📋 Create Work Orders',
                    description: 'Click the + Create Work Order button to add jobs from your rental documents. You can even scan documents with AI to auto-fill details.',
                    highlight: '.create-order-btn'
                },
                {
                    title: '🚗 Track Your Fleet',
                    description: 'Monitor all your equipment, fuel deliveries, and job statuses in real-time from the dashboard. See everything at a glance.',
                    highlight: '.fleet-tracker'
                },
                {
                    title: '📊 View Delivery History',
                    description: 'See every fuel delivery with gallons, timestamps, and worker information. Export reports for your records.',
                    highlight: '.delivery-history'
                }
            ],
            vendor: [
                {
                    title: '👋 Welcome to FleetConnect!',
                    description: 'Your dispatch and management hub for coordinating field work and managing your vendor operations efficiently.',
                    highlight: null
                },
                {
                    title: '✅ Accept Jobs',
                    description: 'Review incoming work orders and accept or decline them from the Work Orders page. Control your workload.',
                    highlight: '.jobs-list'
                },
                {
                    title: '👥 Assign Field Workers',
                    description: 'Assign accepted jobs to your field team with one click. Track who\'s working on what in real-time.',
                    highlight: '.assign-worker-btn'
                },
                {
                    title: '💰 Track Invoices',
                    description: 'Match QuickBooks invoices with deliveries and export reports. Keep everything organized and auditable.',
                    highlight: '.invoices-section'
                }
            ],
            fieldworker: [
                {
                    title: '👋 Welcome to FleetConnect!',
                    description: 'Your mobile job management tool for completing field work and reporting deliveries on the go.',
                    highlight: null
                },
                {
                    title: '📍 View Your Jobs',
                    description: 'See all jobs assigned to you with locations, contacts, equipment details, and special instructions.',
                    highlight: '.jobs-list'
                },
                {
                    title: '📝 Create Invoices',
                    description: 'Tap Create Invoice, select units, enter fuel data, capture GPS location, and attach photos. Complete jobs in the field.',
                    highlight: '.create-invoice-btn'
                },
                {
                    title: '⚠️ Report Incidents',
                    description: 'Use the incident toggle to document and photograph any issues or problems encountered during delivery.',
                    highlight: '.incident-toggle'
                }
            ],
            admin: [
                {
                    title: '👋 Welcome to FleetConnect!',
                    description: 'System administration dashboard for managing all platform users, companies, and operations.',
                    highlight: null
                },
                {
                    title: '👤 Manage Users',
                    description: 'Add, edit, and remove users from the system. Assign roles (admin, vendor, fieldworker, rental) and companies.',
                    highlight: '.manage-users-btn'
                },
                {
                    title: '📊 Monitor Everything',
                    description: 'View all work orders, invoices, and reports across the entire platform. Get complete visibility.',
                    highlight: '.analytics-dashboard'
                },
                {
                    title: '⚙️ Settings',
                    description: 'Configure system preferences and manage your account. Set up integrations and customize the platform.',
                    highlight: '.settings-btn'
                }
            ]
        };

        this.steps = roleSteps[role] || roleSteps.rental;
    }

    /**
     * Inject CSS styles into the page
     */
    injectStyles() {
        if (document.getElementById('fc-onboarding-styles')) return;

        const style = document.createElement('style');
        style.id = 'fc-onboarding-styles';
        style.textContent = `
            .fc-onboarding-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                animation: fc-fade-in 0.3s ease-out forwards;
            }

            @keyframes fc-fade-in {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes fc-slide-in {
                from {
                    transform: translateY(30px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .fc-onboarding-overlay.fade-out {
                animation: fc-fade-out 0.3s ease-out forwards;
            }

            @keyframes fc-fade-out {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }

            .fc-onboarding-card {
                background: #1a1a1a;
                border-radius: 16px;
                padding: 60px 40px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                color: #f5f0e8;
                animation: fc-slide-in 0.4s ease-out forwards;
                border: 1px solid #333;
            }

            .fc-onboarding-card.slide-out {
                animation: fc-slide-out 0.3s ease-out forwards;
            }

            @keyframes fc-slide-out {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(-30px);
                    opacity: 0;
                }
            }

            .fc-onboarding-emoji {
                font-size: 64px;
                margin-bottom: 24px;
                display: block;
            }

            .fc-onboarding-title {
                font-size: 32px;
                font-weight: 600;
                margin-bottom: 16px;
                color: #f5f0e8;
            }

            .fc-onboarding-description {
                font-size: 16px;
                line-height: 1.6;
                color: #d1ccc0;
                margin-bottom: 32px;
            }

            .fc-onboarding-progress {
                display: flex;
                gap: 8px;
                justify-content: center;
                margin-bottom: 32px;
            }

            .fc-progress-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #444;
                transition: all 0.3s ease;
            }

            .fc-progress-dot.active {
                background: #60a5fa;
                width: 24px;
                border-radius: 4px;
            }

            .fc-onboarding-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }

            .fc-onboarding-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .fc-onboarding-btn-primary {
                background: #60a5fa;
                color: #1a1a1a;
            }

            .fc-onboarding-btn-primary:hover {
                background: #7cb3f8;
                transform: translateY(-2px);
            }

            .fc-onboarding-btn-secondary {
                background: #333;
                color: #f5f0e8;
                border: 1px solid #555;
            }

            .fc-onboarding-btn-secondary:hover {
                background: #444;
                transform: translateY(-2px);
            }

            .fc-onboarding-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }

            .fc-onboarding-btn-skip {
                font-size: 12px;
                padding: 8px 16px;
                background: transparent;
                color: #999;
                border: none;
                text-transform: lowercase;
                letter-spacing: 0;
            }

            .fc-onboarding-btn-skip:hover {
                color: #bbb;
            }

            .fc-onboarding-highlight {
                position: relative;
            }

            .fc-onboarding-highlight::after {
                content: '';
                position: absolute;
                border: 2px solid #60a5fa;
                border-radius: 8px;
                box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1), inset 0 0 0 2px #60a5fa;
                pointer-events: none;
                animation: fc-pulse 2s infinite;
            }

            @keyframes fc-pulse {
                0%, 100% {
                    box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1), inset 0 0 0 2px #60a5fa;
                }
                50% {
                    box-shadow: 0 0 0 8px rgba(96, 165, 250, 0.2), inset 0 0 0 2px #60a5fa;
                }
            }

            /* Responsive adjustments */
            @media (max-width: 768px) {
                .fc-onboarding-card {
                    padding: 40px 24px;
                    max-width: 95%;
                }

                .fc-onboarding-emoji {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .fc-onboarding-title {
                    font-size: 24px;
                    margin-bottom: 12px;
                }

                .fc-onboarding-description {
                    font-size: 14px;
                    margin-bottom: 24px;
                }

                .fc-onboarding-btn {
                    padding: 10px 20px;
                    font-size: 12px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Extract emoji from title
     */
    getEmoji(title) {
        const match = title.match(/^([^\s]+)\s/);
        return match ? match[1] : '📌';
    }

    /**
     * Show the onboarding overlay
     */
    show() {
        // Re-fetch user in case it changed
        this.user = this.getCurrentUser();
        if (!this.user) {
            console.warn('No user found for onboarding');
            return;
        }

        this.currentStep = 0;
        this.isVisible = true;
        this.render();
    }

    /**
     * Hide the onboarding overlay
     */
    hide() {
        if (!this.overlayElement) return;

        this.overlayElement.classList.add('fade-out');
        setTimeout(() => {
            if (this.overlayElement && this.overlayElement.parentNode) {
                this.overlayElement.parentNode.removeChild(this.overlayElement);
            }
            this.overlayElement = null;
            this.isVisible = false;
        }, 300);
    }

    /**
     * Mark onboarding as complete and hide
     */
    complete() {
        // Mark onboarding as seen for this specific user
        if (this.storageKey) {
            localStorage.setItem(this.storageKey, 'true');
        }
        this.hide();
    }

    /**
     * Move to next step
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
     * Move to previous step
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.render();
        }
    }

    /**
     * Render the onboarding overlay
     */
    render() {
        // Remove existing overlay
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }

        const step = this.steps[this.currentStep];
        if (!step) return;

        // Create overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'fc-onboarding-overlay';

        // Extract emoji and clean title
        const emoji = this.getEmoji(step.title);
        const cleanTitle = step.title.replace(/^[^\s]+\s/, '');

        // Create card
        const card = document.createElement('div');
        card.className = 'fc-onboarding-card';

        // Emoji
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'fc-onboarding-emoji';
        emojiSpan.textContent = emoji;

        // Title
        const title = document.createElement('h2');
        title.className = 'fc-onboarding-title';
        title.textContent = cleanTitle;

        // Description
        const description = document.createElement('p');
        description.className = 'fc-onboarding-description';
        description.textContent = step.description;

        // Progress dots
        const progressContainer = document.createElement('div');
        progressContainer.className = 'fc-onboarding-progress';

        for (let i = 0; i < this.steps.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'fc-progress-dot';
            if (i === this.currentStep) {
                dot.classList.add('active');
            }
            progressContainer.appendChild(dot);
        }

        // Buttons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'fc-onboarding-buttons';

        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'fc-onboarding-btn fc-onboarding-btn-secondary';
        prevBtn.textContent = '← Previous';
        prevBtn.disabled = this.currentStep === 0;
        prevBtn.onclick = () => this.prevStep();

        // Skip button
        const skipBtn = document.createElement('button');
        skipBtn.className = 'fc-onboarding-btn fc-onboarding-btn-skip';
        skipBtn.textContent = 'Skip Tutorial';
        skipBtn.onclick = () => this.complete();

        // Next/Done button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'fc-onboarding-btn fc-onboarding-btn-primary';
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Get Started!' : 'Next →';
        nextBtn.onclick = () => this.nextStep();

        // Assemble buttons
        if (this.currentStep === 0) {
            buttonsContainer.appendChild(skipBtn);
            buttonsContainer.appendChild(nextBtn);
        } else if (this.currentStep === this.steps.length - 1) {
            buttonsContainer.appendChild(prevBtn);
            buttonsContainer.appendChild(nextBtn);
        } else {
            buttonsContainer.appendChild(prevBtn);
            buttonsContainer.appendChild(skipBtn);
            buttonsContainer.appendChild(nextBtn);
        }

        // Assemble card
        card.appendChild(emojiSpan);
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(progressContainer);
        card.appendChild(buttonsContainer);

        // Assemble overlay
        this.overlayElement.appendChild(card);

        // Add to page
        document.body.appendChild(this.overlayElement);

        // Handle element highlighting if specified
        if (step.highlight) {
            setTimeout(() => this.highlightElement(step.highlight), 500);
        }

        // Close on overlay click (outside card)
        this.overlayElement.addEventListener('click', (e) => {
            if (e.target === this.overlayElement) {
                this.complete();
            }
        });
    }

    /**
     * Highlight an element on the page
     */
    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        // Add highlight class
        if (!element.classList.contains('fc-onboarding-highlight')) {
            element.classList.add('fc-onboarding-highlight');

            // Remove after onboarding is done
            const cleanup = () => {
                element.classList.remove('fc-onboarding-highlight');
                document.removeEventListener('click', cleanup);
            };
            document.addEventListener('click', cleanup);
        }

        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Initialize onboarding when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.fleetConnectOnboarding = new FleetConnectOnboarding();
    });
} else {
    window.fleetConnectOnboarding = new FleetConnectOnboarding();
}
