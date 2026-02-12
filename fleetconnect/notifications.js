// notifications.js — Shared notification bell for all FleetConnect pages
// Self-contained IIFE that auto-injects notification bell into page header

(function() {
    'use strict';

    // Only run if user is authenticated
    if (typeof getCurrentUser !== 'function') return;
    const user = getCurrentUser();
    if (!user) return;

    const LAST_SEEN_KEY = 'fc_notifications_last_seen';
    let notifications = [];
    let isOpen = false;
    let unreadCount = 0;

    // Initialize last seen timestamp if not set
    function initializeLastSeen() {
        if (!sessionStorage.getItem(LAST_SEEN_KEY)) {
            sessionStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
        }
    }

    // Inject CSS styles for the notification bell and dropdown
    function injectStyles() {
        const styleId = 'fc-notifications-styles';
        if (document.getElementById(styleId)) return; // Already injected

        const styles = `
            /* Notification Bell Container */
            #fc-notification-bell-container {
                position: relative;
                margin-left: auto;
                z-index: 1000;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            }

            /* When sidebar header exists, make it flex */
            .sidebar-header {
                display: flex !important;
                align-items: center !important;
            }

            /* Bell Icon Button */
            #fc-notification-bell {
                background: none;
                border: none;
                cursor: pointer;
                padding: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                border-radius: 50%;
                transition: background-color 0.2s ease;
                width: 36px;
                height: 36px;
            }

            #fc-notification-bell:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }

            #fc-notification-bell:active {
                background-color: rgba(255, 255, 255, 0.15);
            }

            /* Bell SVG */
            #fc-notification-bell svg {
                width: 20px;
                height: 20px;
                stroke: #b8b0a8;
                stroke-width: 2;
                fill: none;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            #fc-notification-bell:hover svg {
                stroke: #f5f0e8;
            }

            /* Unread Badge */
            .fc-notification-badge {
                position: absolute;
                top: -2px;
                right: -2px;
                background-color: #ef4444;
                color: white;
                border-radius: 50%;
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                border: 2px solid #242424;
                min-width: 18px;
            }

            .fc-notification-badge.hidden {
                display: none;
            }

            /* Dropdown Panel Container */
            #fc-notifications-dropdown {
                position: absolute;
                top: 44px;
                left: 0;
                background-color: #1e1e1e;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                width: 350px;
                max-height: 400px;
                overflow-y: auto;
                display: none;
                flex-direction: column;
                z-index: 1001;
                border: 1px solid #333;
            }

            #fc-notifications-dropdown.open {
                display: flex;
            }

            /* Dropdown Header */
            .fc-notifications-header {
                padding: 16px;
                border-bottom: 1px solid #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-shrink: 0;
            }

            .fc-notifications-title {
                color: white;
                font-size: 16px;
                font-weight: 600;
                margin: 0;
            }

            .fc-mark-all-read {
                color: #3b82f6;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                text-decoration: none;
                border: none;
                background: none;
                padding: 0;
                transition: color 0.2s ease;
            }

            .fc-mark-all-read:hover {
                color: #2563eb;
                text-decoration: underline;
            }

            /* Notifications List */
            .fc-notifications-list {
                flex: 1;
                overflow-y: auto;
                padding: 0;
                margin: 0;
                list-style: none;
            }

            .fc-notifications-empty {
                padding: 24px 16px;
                text-align: center;
                color: #999;
                font-size: 14px;
            }

            /* Notification Item */
            .fc-notification-item {
                padding: 12px 16px;
                border-bottom: 1px solid #333;
                display: flex;
                gap: 12px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                background-color: transparent;
            }

            .fc-notification-item:last-child {
                border-bottom: none;
            }

            .fc-notification-item:hover {
                background-color: #2a2a2a;
            }

            .fc-notification-item.unread {
                background-color: rgba(59, 130, 246, 0.1);
            }

            .fc-notification-item.unread:hover {
                background-color: rgba(59, 130, 246, 0.15);
            }

            /* Notification Icon */
            .fc-notification-icon {
                flex-shrink: 0;
                width: 32px;
                height: 32px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }

            .fc-notification-icon.delivery {
                background-color: rgba(34, 197, 94, 0.2);
                color: #22c55e;
            }

            .fc-notification-icon.status {
                background-color: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
            }

            .fc-notification-icon.alert {
                background-color: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }

            /* Notification Content */
            .fc-notification-content {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .fc-notification-title {
                color: white;
                font-size: 13px;
                font-weight: 600;
                margin: 0;
                word-break: break-word;
            }

            .fc-notification-description {
                color: #999;
                font-size: 12px;
                margin: 0;
                word-break: break-word;
            }

            .fc-notification-time {
                color: #666;
                font-size: 11px;
                margin: 0;
            }

            /* Scrollbar styling */
            #fc-notifications-dropdown::-webkit-scrollbar {
                width: 6px;
            }

            #fc-notifications-dropdown::-webkit-scrollbar-track {
                background: transparent;
            }

            #fc-notifications-dropdown::-webkit-scrollbar-thumb {
                background-color: #444;
                border-radius: 3px;
            }

            #fc-notifications-dropdown::-webkit-scrollbar-thumb:hover {
                background-color: #555;
            }

            /* Overlay for closing dropdown */
            #fc-notifications-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 999;
                display: none;
            }

            #fc-notifications-overlay.open {
                display: block;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.id = styleId;
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Inject HTML for bell icon and dropdown into the page
    function injectHTML() {
        const containerId = 'fc-notification-bell-container';
        if (document.getElementById(containerId)) return; // Already injected

        // Create bell container
        const container = document.createElement('div');
        container.id = containerId;

        // Create overlay for closing dropdown
        const overlay = document.createElement('div');
        overlay.id = 'fc-notifications-overlay';

        // Create bell button with SVG
        const bellButton = document.createElement('button');
        bellButton.id = 'fc-notification-bell';
        bellButton.setAttribute('aria-label', 'Notifications');
        bellButton.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div class="fc-notification-badge hidden" id="fc-notification-badge">0</div>
        `;

        // Create dropdown panel
        const dropdown = document.createElement('div');
        dropdown.id = 'fc-notifications-dropdown';
        dropdown.innerHTML = `
            <div class="fc-notifications-header">
                <h3 class="fc-notifications-title">Notifications</h3>
                <button class="fc-mark-all-read" id="fc-mark-all-read">Mark all read</button>
            </div>
            <ul class="fc-notifications-list" id="fc-notifications-list">
                <li class="fc-notifications-empty">No notifications</li>
            </ul>
        `;

        // Assemble container
        container.appendChild(bellButton);
        container.appendChild(dropdown);

        // Add to sidebar header if it exists, otherwise fall back to nav-right or body
        const sidebarHeader = document.querySelector('.sidebar-header');
        const navRight = document.querySelector('.nav-right');

        if (sidebarHeader) {
            sidebarHeader.appendChild(container);
        } else if (navRight) {
            navRight.insertBefore(container, navRight.firstChild);
        } else {
            container.style.position = 'fixed';
            container.style.top = '16px';
            container.style.right = '24px';
            document.body.appendChild(container);
        }
        document.body.appendChild(overlay);

        // Attach event listeners
        bellButton.addEventListener('click', toggleDropdown);
        overlay.addEventListener('click', closeDropdown);
        document.getElementById('fc-mark-all-read').addEventListener('click', markAllRead);

        // Close dropdown on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isOpen) {
                closeDropdown();
            }
        });
    }

    // Toggle dropdown visibility
    function toggleDropdown(e) {
        e.stopPropagation();
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    // Open dropdown
    function openDropdown() {
        isOpen = true;
        document.getElementById('fc-notifications-dropdown').classList.add('open');
        document.getElementById('fc-notifications-overlay').classList.add('open');
    }

    // Close dropdown
    function closeDropdown() {
        isOpen = false;
        document.getElementById('fc-notifications-dropdown').classList.remove('open');
        document.getElementById('fc-notifications-overlay').classList.remove('open');
    }

    // Calculate relative time string
    function getRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }

    // Calculate unread count based on last seen
    function calculateUnreadCount() {
        const lastSeen = sessionStorage.getItem(LAST_SEEN_KEY);
        if (!lastSeen) return notifications.length;

        const lastSeenTime = new Date(lastSeen).getTime();
        return notifications.filter(n => new Date(n.timestamp).getTime() > lastSeenTime).length;
    }

    // Update the badge count
    function updateBadge() {
        unreadCount = calculateUnreadCount();
        const badge = document.getElementById('fc-notification-badge');
        const bell = document.getElementById('fc-notification-bell');

        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    // Render the notification dropdown with current notifications
    function renderDropdown() {
        const list = document.getElementById('fc-notifications-list');

        if (notifications.length === 0) {
            list.innerHTML = '<li class="fc-notifications-empty">No notifications</li>';
            return;
        }

        const lastSeen = sessionStorage.getItem(LAST_SEEN_KEY);
        const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;

        const html = notifications.map(notification => {
            const isUnread = new Date(notification.timestamp).getTime() > lastSeenTime;
            const relativeTime = getRelativeTime(notification.timestamp);

            return `
                <li class="fc-notification-item ${isUnread ? 'unread' : ''}">
                    <div class="fc-notification-icon ${notification.type}">
                        ${notification.icon}
                    </div>
                    <div class="fc-notification-content">
                        <p class="fc-notification-title">${escapeHtml(notification.title)}</p>
                        <p class="fc-notification-description">${escapeHtml(notification.description)}</p>
                        <p class="fc-notification-time">${relativeTime}</p>
                    </div>
                </li>
            `;
        }).join('');

        list.innerHTML = html;
    }

    // HTML escape helper
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Load notifications from Supabase
    async function loadNotifications() {
        try {
            // Check if db is available
            if (typeof db === 'undefined') {
                console.warn('[Notifications] Supabase client not available');
                return;
            }

            notifications = [];
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Load recent deliveries
            try {
                const { data: deliveries, error: deliveryError } = await db
                    .from('deliveries')
                    .select('id, gallons, job_id, timestamp, jobs(job_site_name)')
                    .gte('timestamp', sevenDaysAgo.toISOString())
                    .order('timestamp', { ascending: false })
                    .limit(10);

                if (deliveryError) {
                    console.warn('[Notifications] Error loading deliveries:', deliveryError.message);
                } else if (deliveries && deliveries.length > 0) {
                    deliveries.forEach(delivery => {
                        const jobName = delivery.jobs?.job_site_name || 'Unknown Site';
                        notifications.push({
                            id: `delivery-${delivery.id}`,
                            type: 'delivery',
                            icon: '🚚',
                            title: 'New Delivery',
                            description: `${delivery.gallons} gallons at ${jobName}`,
                            timestamp: delivery.timestamp
                        });
                    });
                }
            } catch (err) {
                console.warn('[Notifications] Exception loading deliveries:', err.message);
            }

            // Load recent job status changes
            try {
                const { data: jobs, error: jobError } = await db
                    .from('jobs')
                    .select('id, job_site_name, status, created_at')
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (jobError) {
                    console.warn('[Notifications] Error loading jobs:', jobError.message);
                } else if (jobs && jobs.length > 0) {
                    jobs.forEach(job => {
                        const statusText = job.status ? job.status.charAt(0).toUpperCase() + job.status.slice(1) : 'Updated';
                        notifications.push({
                            id: `job-${job.id}`,
                            type: 'status',
                            icon: '📋',
                            title: 'Job Status Changed',
                            description: `${job.job_site_name || 'Unknown Job'} - Status: ${statusText}`,
                            timestamp: job.created_at
                        });
                    });
                }
            } catch (err) {
                console.warn('[Notifications] Exception loading jobs:', err.message);
            }

            // Sort all notifications by timestamp (newest first)
            notifications.sort((a, b) => {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            // Limit to 20 most recent
            notifications = notifications.slice(0, 20);

            // Update UI
            updateBadge();
            renderDropdown();

        } catch (error) {
            console.error('[Notifications] Fatal error loading notifications:', error);
        }
    }

    // Mark all notifications as read
    function markAllRead() {
        sessionStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
        updateBadge();
        renderDropdown();
    }

    // Refresh notifications periodically (every 30 seconds)
    function startAutoRefresh() {
        setInterval(() => {
            if (!isOpen) {
                loadNotifications();
            }
        }, 30000);
    }

    // Initialize
    function init() {
        try {
            initializeLastSeen();
            injectStyles();
            injectHTML();
            loadNotifications();
            startAutoRefresh();
        } catch (error) {
            console.error('[Notifications] Initialization error:', error);
        }
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
