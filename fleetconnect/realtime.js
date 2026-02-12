// realtime.js — Real-time updates for FleetConnect pages via Supabase Realtime
// Self-contained IIFE that subscribes to table changes and displays live indicators

(function() {
    'use strict';

    // Only run if user is authenticated and db is available
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    if (!user) return;
    if (typeof db === 'undefined') return;

    // Configuration
    const RECONNECT_DELAY = 5000;
    const TOAST_STACK_MAX = 3;
    const TOAST_DISMISS_TIME = 5000;
    let channels = [];
    let isConnected = false;
    let toastStack = [];
    let activeSubscriptions = {};
    let reconnectDebounceTimer = null;

    // ============================================================================
    // STYLE INJECTION
    // ============================================================================

    function injectStyles() {
        const styleId = 'fc-realtime-styles';
        if (document.getElementById(styleId)) return; // Already injected

        const styles = `
            /* Live Indicator Container */
            #fc-live-indicator-container {
                display: none;
            }

            /* Live Indicator Dot */
            #fc-live-indicator-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background-color: #22c55e;
                display: inline-block;
            }

            #fc-live-indicator-dot.connected {
                animation: fc-pulse-green 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            #fc-live-indicator-dot.disconnected {
                background-color: #ef4444;
                animation: none;
            }

            #fc-live-indicator-text {
                font-size: 12px;
                font-weight: 500;
                color: #f5f0e8;
            }

            #fc-live-indicator-text.disconnected {
                color: #fca5a5;
            }

            /* Pulsing animation */
            @keyframes fc-pulse-green {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }

            /* Toast Container Stack */
            #fc-realtime-toast-container {
                position: fixed;
                top: 70px;
                right: 24px;
                z-index: 998;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-width: 400px;
            }

            /* Individual Toast */
            .fc-realtime-toast {
                background-color: #2a2a2a;
                border-radius: 6px;
                padding: 12px 16px;
                color: #f5f0e8;
                font-size: 13px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
                border-left: 3px solid #999;
                display: flex;
                align-items: center;
                gap: 10px;
                pointer-events: auto;
                animation: fc-toast-slide-in 0.3s ease-out;
                min-height: 44px;
            }

            .fc-realtime-toast.delivery {
                border-left-color: #22c55e;
            }

            .fc-realtime-toast.status {
                border-left-color: #3b82f6;
            }

            .fc-realtime-toast.alert {
                border-left-color: #ef4444;
            }

            .fc-realtime-toast.success {
                border-left-color: #22c55e;
            }

            /* Toast Icon */
            .fc-realtime-toast-icon {
                flex-shrink: 0;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            /* Toast Message */
            .fc-realtime-toast-message {
                flex: 1;
                line-height: 1.4;
            }

            /* Toast Close Button */
            .fc-realtime-toast-close {
                flex-shrink: 0;
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                padding: 0;
                font-size: 16px;
                line-height: 1;
                transition: color 0.2s ease;
            }

            .fc-realtime-toast-close:hover {
                color: #ccc;
            }

            /* Toast Dismiss Animation */
            @keyframes fc-toast-slide-in {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes fc-toast-slide-out {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }

            .fc-realtime-toast.dismissing {
                animation: fc-toast-slide-out 0.3s ease-in forwards;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // ============================================================================
    // LIVE INDICATOR INJECTION
    // ============================================================================

    function injectLiveIndicator() {
        const containerId = 'fc-live-indicator-container';
        if (document.getElementById(containerId)) return; // Already injected

        const container = document.createElement('div');
        container.id = containerId;
        container.innerHTML = `
            <div id="fc-live-indicator-dot" class="connected"></div>
            <span id="fc-live-indicator-text">Live</span>
        `;

        document.body.appendChild(container);
    }

    // ============================================================================
    // TOAST NOTIFICATION SYSTEM
    // ============================================================================

    function injectToastContainer() {
        const containerId = 'fc-realtime-toast-container';
        if (document.getElementById(containerId)) return; // Already injected

        const container = document.createElement('div');
        container.id = containerId;
        document.body.appendChild(container);
    }

    function showToast(message, type = 'status') {
        // Map type to icon
        const icons = {
            'delivery': '🚚',
            'status': '📋',
            'alert': '⚠️',
            'success': '✓'
        };

        const icon = icons[type] || '•';

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `fc-realtime-toast ${type}`;
        toast.innerHTML = `
            <div class="fc-realtime-toast-icon">${icon}</div>
            <div class="fc-realtime-toast-message">${escapeHtml(message)}</div>
            <button class="fc-realtime-toast-close" aria-label="Close notification">×</button>
        `;

        // Get container
        const container = document.getElementById('fc-realtime-toast-container');
        if (!container) return;

        // Add toast to container
        container.appendChild(toast);
        toastStack.push(toast);

        // Trim stack if over max
        if (toastStack.length > TOAST_STACK_MAX) {
            const oldToast = toastStack.shift();
            dismissToast(oldToast);
        }

        // Set up close button
        const closeBtn = toast.querySelector('.fc-realtime-toast-close');
        closeBtn.addEventListener('click', () => dismissToast(toast));

        // Auto-dismiss after timeout
        const timeout = setTimeout(() => dismissToast(toast), TOAST_DISMISS_TIME);
        toast.dataset.timeout = timeout;
    }

    function dismissToast(toast) {
        if (!toast || !toast.parentElement) return;

        // Clear timeout if still pending
        if (toast.dataset.timeout) {
            clearTimeout(parseInt(toast.dataset.timeout));
        }

        // Add dismissing class for animation
        toast.classList.add('dismissing');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            // Remove from stack
            toastStack = toastStack.filter(t => t !== toast);
        }, 300);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ============================================================================
    // CONNECTION STATUS MANAGEMENT
    // ============================================================================

    function updateConnectionStatus(connected) {
        isConnected = connected;

        const dot = document.getElementById('fc-live-indicator-dot');
        const text = document.getElementById('fc-live-indicator-text');

        if (!dot || !text) return;

        if (connected) {
            dot.classList.remove('disconnected');
            dot.classList.add('connected');
            text.classList.remove('disconnected');
            text.textContent = 'Live';
        } else {
            dot.classList.remove('connected');
            dot.classList.add('disconnected');
            text.classList.add('disconnected');
            text.textContent = 'Offline';
        }
    }

    // ============================================================================
    // PAGE REFRESH TRIGGER (DEBOUNCED)
    // ============================================================================

    function triggerPageRefresh() {
        if (typeof window.loadData === 'function') {
            // Debounce: wait 1 second before refreshing to batch rapid changes
            clearTimeout(window._realtimeRefreshTimer);
            window._realtimeRefreshTimer = setTimeout(() => {
                try {
                    window.loadData();
                } catch (err) {
                    console.warn('[Realtime] Error calling loadData():', err.message);
                }
            }, 1000);
        }
    }

    // ============================================================================
    // EMAIL NOTIFICATION SYSTEM
    // ============================================================================

    async function sendEmailNotification(type, data) {
        try {
            // Get current user info for notifications
            const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
            if (!currentUser) {
                console.warn('[Realtime] Could not send email notification: user not authenticated');
                return;
            }

            // Build notification payload based on type
            let payload = {
                type,
                jobId: data.jobId || data.job_id || 'unknown',
                recipientEmail: data.recipientEmail || data.recipient_email || currentUser.email,
                recipientName: data.recipientName || data.recipient_name || currentUser.name || 'Team Member',
                details: {
                    jobSiteName: data.jobSiteName || data.job_site_name || 'Job'
                }
            };

            // Add type-specific details
            if (type === 'job_assigned') {
                payload.details = {
                    ...payload.details,
                    jobId: data.jobId || data.job_id,
                    assignedAt: data.assignedAt || data.assigned_at || new Date().toISOString(),
                    estimatedHours: data.estimatedHours || data.estimated_hours,
                    location: data.location || data.job_location
                };
            } else if (type === 'status_changed') {
                payload.details = {
                    ...payload.details,
                    jobId: data.jobId || data.job_id,
                    oldStatus: data.oldStatus || data.old_status,
                    newStatus: data.newStatus || data.new_status,
                    changedAt: data.changedAt || data.changed_at || new Date().toISOString(),
                    reason: data.reason || data.change_reason
                };
            } else if (type === 'invoice_submitted') {
                payload.details = {
                    ...payload.details,
                    invoiceId: data.invoiceId || data.invoice_id || 'unknown',
                    jobId: data.jobId || data.job_id,
                    amount: data.amount || data.invoice_amount,
                    submittedAt: data.submittedAt || data.submitted_at || new Date().toISOString(),
                    workerName: data.workerName || data.worker_name
                };
            }

            // Get auth token from localStorage
            const token = localStorage.getItem('auth_token');
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Send notification to API endpoint
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                console.warn('[Realtime] Error sending email notification:', error.message || error.error);
                return;
            }

            const result = await response.json();
            console.log('[Realtime] Email notification sent:', result.type, 'to', result.recipientEmail);
            return result;
        } catch (err) {
            console.warn('[Realtime] Error sending email notification:', err.message);
        }
    }

    // Make function globally available for other scripts
    window.sendEmailNotification = sendEmailNotification;

    // ============================================================================
    // SUPABASE CHANNEL SUBSCRIPTIONS
    // ============================================================================

    function subscribeDeliveries() {
        const channelName = 'deliveries-changes';
        // Check if already subscribed
        if (activeSubscriptions[channelName]) {
            console.log('[Realtime] Already subscribed to deliveries, skipping duplicate');
            return;
        }

        const channel = db.channel(channelName, {
            config: {
                broadcast: { ack: false }
            }
        })
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'deliveries' },
                (payload) => {
                    try {
                        const d = payload.new;
                        const gallons = d.gallons ? d.gallons.toLocaleString() : '0';
                        showToast(`New delivery: ${gallons} gallons loaded`, 'delivery');
                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing delivery INSERT:', err.message);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'deliveries' },
                (payload) => {
                    try {
                        const d = payload.new;
                        showToast(`Delivery updated: ${d.gallons || 0} gallons`, 'status');
                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing delivery UPDATE:', err.message);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'deliveries' },
                (payload) => {
                    try {
                        showToast('Delivery record deleted', 'alert');
                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing delivery DELETE:', err.message);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Subscribed to deliveries');
                    activeSubscriptions[channelName] = true;
                    updateConnectionStatus(true);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.warn('[Realtime] Subscription status:', status);
                    updateConnectionStatus(false);
                    // Debounce reconnection to prevent flooding
                    clearTimeout(reconnectDebounceTimer);
                    reconnectDebounceTimer = setTimeout(() => {
                        delete activeSubscriptions[channelName];
                        attemptReconnect();
                    }, 5000);
                }
            });

        channels.push(channel);
    }

    function subscribeJobs() {
        const channelName = 'jobs-changes';
        // Check if already subscribed
        if (activeSubscriptions[channelName]) {
            console.log('[Realtime] Already subscribed to jobs, skipping duplicate');
            return;
        }

        const channel = db.channel(channelName, {
            config: {
                broadcast: { ack: false }
            }
        })
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'jobs' },
                (payload) => {
                    try {
                        const j = payload.new;
                        const siteName = j.job_site_name || 'Unknown Site';
                        showToast(`New work order: ${siteName}`, 'status');

                        // Send email notification for job assignment
                        if (j.assigned_to_email) {
                            sendEmailNotification('job_assigned', {
                                jobId: j.id,
                                jobSiteName: siteName,
                                recipientEmail: j.assigned_to_email,
                                recipientName: j.assigned_to_name,
                                assignedAt: j.created_at,
                                estimatedHours: j.estimated_hours,
                                location: j.job_location
                            });
                        }

                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing job INSERT:', err.message);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'jobs' },
                (payload) => {
                    try {
                        const j = payload.new;
                        const oldJob = payload.old;
                        const siteName = j.job_site_name || 'Unknown Site';
                        const status = j.status ? j.status.charAt(0).toUpperCase() + j.status.slice(1) : 'Updated';
                        showToast(`Work order updated: ${siteName} → ${status}`, 'status');

                        // Send email notification for status change
                        if (oldJob && oldJob.status !== j.status && j.assigned_to_email) {
                            sendEmailNotification('status_changed', {
                                jobId: j.id,
                                jobSiteName: siteName,
                                recipientEmail: j.assigned_to_email,
                                recipientName: j.assigned_to_name,
                                oldStatus: oldJob.status,
                                newStatus: j.status,
                                changedAt: new Date().toISOString(),
                                reason: j.status_reason
                            });
                        }

                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing job UPDATE:', err.message);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'jobs' },
                (payload) => {
                    try {
                        const j = payload.new;
                        const siteName = j.job_site_name || 'Unknown Site';
                        showToast(`Work order deleted: ${siteName}`, 'alert');
                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing job DELETE:', err.message);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Subscribed to jobs');
                    activeSubscriptions[channelName] = true;
                    updateConnectionStatus(true);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.warn('[Realtime] Jobs subscription status:', status);
                    updateConnectionStatus(false);
                    // Debounce reconnection to prevent flooding
                    clearTimeout(reconnectDebounceTimer);
                    reconnectDebounceTimer = setTimeout(() => {
                        delete activeSubscriptions[channelName];
                        attemptReconnect();
                    }, 5000);
                }
            });

        channels.push(channel);
    }

    function subscribeInvoices() {
        const channelName = 'invoices-changes';
        // Check if already subscribed
        if (activeSubscriptions[channelName]) {
            console.log('[Realtime] Already subscribed to invoices, skipping duplicate');
            return;
        }

        const channel = db.channel(channelName, {
            config: {
                broadcast: { ack: false }
            }
        })
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'invoices' },
                (payload) => {
                    try {
                        const inv = payload.new;
                        const workerName = inv.worker_name || 'a field worker';
                        showToast(`New invoice submitted by ${workerName}`, 'delivery');

                        // Send email notification for invoice submission
                        if (inv.job_id && inv.recipient_email) {
                            sendEmailNotification('invoice_submitted', {
                                invoiceId: inv.id,
                                jobId: inv.job_id,
                                jobSiteName: inv.job_site_name || 'Job',
                                recipientEmail: inv.recipient_email,
                                recipientName: inv.recipient_name || 'Manager',
                                amount: inv.total_amount || inv.amount,
                                submittedAt: inv.created_at,
                                workerName: workerName
                            });
                        }

                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing invoice INSERT:', err.message);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'invoices' },
                (payload) => {
                    try {
                        const inv = payload.new;
                        const workerName = inv.worker_name || 'a worker';
                        showToast(`Invoice updated by ${workerName}`, 'status');
                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing invoice UPDATE:', err.message);
                    }
                }
            )
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'invoices' },
                (payload) => {
                    try {
                        showToast('Invoice record deleted', 'alert');
                        triggerPageRefresh();
                    } catch (err) {
                        console.warn('[Realtime] Error processing invoice DELETE:', err.message);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Subscribed to invoices');
                    activeSubscriptions[channelName] = true;
                    updateConnectionStatus(true);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.warn('[Realtime] Invoices subscription status:', status);
                    updateConnectionStatus(false);
                    // Debounce reconnection to prevent flooding
                    clearTimeout(reconnectDebounceTimer);
                    reconnectDebounceTimer = setTimeout(() => {
                        delete activeSubscriptions[channelName];
                        attemptReconnect();
                    }, 5000);
                }
            });

        channels.push(channel);
    }

    // ============================================================================
    // CLEANUP AND LIFECYCLE
    // ============================================================================

    function cleanup() {
        // Close all channels
        channels.forEach(ch => {
            try {
                db.removeChannel(ch);
            } catch (err) {
                // Silently fail - channel may already be closed
            }
        });
        channels = [];

        // Clear any pending toasts
        const container = document.getElementById('fc-realtime-toast-container');
        if (container) {
            container.innerHTML = '';
        }
        toastStack = [];

        // Clear any pending refresh timers
        if (window._realtimeRefreshTimer) {
            clearTimeout(window._realtimeRefreshTimer);
        }
    }

    // ============================================================================
    // RECONNECTION LOGIC
    // ============================================================================

    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    let reconnectTimer = null;

    function attemptReconnect() {
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.warn('[Realtime] Max reconnect attempts reached. Giving up.');
            updateConnectionStatus(false);
            return;
        }

        reconnectAttempts++;
        const delay = RECONNECT_DELAY * Math.min(reconnectAttempts, 3); // Exponential backoff up to 3x
        console.log('[Realtime] Reconnecting in ' + (delay / 1000) + 's (attempt ' + reconnectAttempts + '/' + MAX_RECONNECT_ATTEMPTS + ')');

        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
            cleanup();
            try {
                subscribeDeliveries();
                subscribeJobs();
                subscribeInvoices();
                console.log('[Realtime] Reconnection attempt ' + reconnectAttempts + ' initiated');
            } catch (err) {
                console.error('[Realtime] Reconnection failed:', err.message);
                attemptReconnect();
            }
        }, delay);
    }

    function init() {
        try {
            // Inject styles and UI elements
            injectStyles();
            injectLiveIndicator();
            injectToastContainer();

            // Subscribe to all tables
            subscribeDeliveries();
            subscribeJobs();
            subscribeInvoices();

            // Set initial connected state
            updateConnectionStatus(isConnected);

            // Clean up on page unload
            window.addEventListener('beforeunload', cleanup);

            console.log('[Realtime] Initialized successfully');
        } catch (error) {
            console.error('[Realtime] Initialization error:', error);
        }
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
