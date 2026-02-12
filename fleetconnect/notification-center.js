// Notification Center
(function() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    const bell = sidebar.querySelector('.notification-bell');
    if (!bell) return;

    // Wrap bell with badge container
    const bellWrapper = document.createElement('span');
    bellWrapper.className = 'notif-bell-wrapper';
    bellWrapper.style.position = 'relative';
    bellWrapper.style.display = 'inline-block';
    bell.parentNode.insertBefore(bellWrapper, bell);
    bellWrapper.appendChild(bell);

    // Badge
    const badge = document.createElement('span');
    badge.className = 'notif-badge';
    badge.style.display = 'none';
    bellWrapper.appendChild(badge);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'notif-panel';
    panel.style.display = 'none';
    panel.innerHTML = `
        <div class="notif-panel-header">
            <span class="notif-panel-title">Notifications</span>
            <button class="notif-mark-all" title="Mark all as read">✓ All</button>
        </div>
        <div class="notif-panel-body"></div>
    `;
    sidebar.appendChild(panel);

    const panelBody = panel.querySelector('.notif-panel-body');
    const markAllBtn = panel.querySelector('.notif-mark-all');
    let currentUserId = null;

    // Get user ID
    try {
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            currentUserId = u.id;
        }
    } catch(e) {}

    bell.addEventListener('click', function(e) {
        e.stopPropagation();
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            loadNotifications();
        } else {
            panel.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!panel.contains(e.target) && !bellWrapper.contains(e.target)) {
            panel.style.display = 'none';
        }
    });

    markAllBtn.addEventListener('click', async function() {
        if (!currentUserId || typeof db === 'undefined') return;
        try {
            await db.from('notifications').update({ read: true }).eq('user_id', currentUserId).eq('read', false);
            loadNotifications();
        } catch(e) {}
    });

    async function loadNotifications() {
        if (typeof db === 'undefined') {
            panelBody.innerHTML = '<div class="notif-empty">No notifications</div>';
            return;
        }

        try {
            let query = db.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
            if (currentUserId) query = query.eq('user_id', currentUserId);

            const { data, error } = await query;
            if (error || !data || data.length === 0) {
                panelBody.innerHTML = '<div class="notif-empty">No notifications</div>';
                updateBadge(0);
                return;
            }

            const unread = data.filter(n => !n.read).length;
            updateBadge(unread);

            panelBody.innerHTML = data.map(function(n) {
                const icons = { info: 'ℹ️', warning: '⚠️', success: '✅', error: '❌' };
                const icon = icons[n.type] || 'ℹ️';
                const readClass = n.read ? 'notif-read' : '';
                return `<div class="notif-item ${readClass}" data-id="${n.id}">
                    <span class="notif-item-icon">${icon}</span>
                    <div class="notif-item-content">
                        <div class="notif-item-title">${escapeHtml(n.title)}</div>
                        <div class="notif-item-msg">${escapeHtml(n.message || '')}</div>
                        <div class="notif-item-time">${timeAgo(n.created_at)}</div>
                    </div>
                </div>`;
            }).join('');

            panelBody.querySelectorAll('.notif-item').forEach(function(item) {
                item.addEventListener('click', async function() {
                    const id = item.getAttribute('data-id');
                    if (!item.classList.contains('notif-read')) {
                        try {
                            await db.from('notifications').update({ read: true }).eq('id', id);
                            item.classList.add('notif-read');
                            const current = parseInt(badge.textContent) || 0;
                            updateBadge(Math.max(0, current - 1));
                        } catch(e) {}
                    }
                });
            });
        } catch(e) {
            panelBody.innerHTML = '<div class="notif-empty">No notifications</div>';
        }
    }

    function updateBadge(count) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    function timeAgo(dateStr) {
        const now = new Date();
        const d = new Date(dateStr);
        const s = Math.floor((now - d) / 1000);
        if (s < 60) return 'Just now';
        const m = Math.floor(s / 60);
        if (m < 60) return m + ' min ago';
        const h = Math.floor(m / 60);
        if (h < 24) return h + ' hour' + (h > 1 ? 's' : '') + ' ago';
        const days = Math.floor(h / 24);
        if (days < 7) return days + ' day' + (days > 1 ? 's' : '') + ' ago';
        return d.toLocaleDateString();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Auto-refresh
    loadNotifications();
    setInterval(loadNotifications, 30000);

    // Styles
    const style = document.createElement('style');
    style.textContent = `
        .notif-bell-wrapper { position: relative; display: inline-block; }
        .notif-badge {
            position: absolute;
            top: -6px;
            right: -8px;
            background: #ef4444;
            color: white;
            font-size: 0.6rem;
            font-weight: 700;
            min-width: 16px;
            height: 16px;
            line-height: 16px;
            text-align: center;
            border-radius: 99px;
            padding: 0 4px;
        }
        .notif-panel {
            position: absolute;
            left: 12px;
            right: 12px;
            top: 100px;
            background: var(--bg-card, #242424);
            border: 1px solid var(--border, #333);
            border-radius: 12px;
            z-index: 300;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            max-height: 420px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .notif-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 14px;
            border-bottom: 1px solid var(--border, #333);
        }
        .notif-panel-title { font-size: 0.9rem; font-weight: 600; }
        .notif-mark-all {
            background: none;
            border: 1px solid var(--border, #333);
            color: var(--text-secondary, #888);
            font-size: 0.72rem;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
        }
        .notif-mark-all:hover { color: var(--accent, #60a5fa); border-color: var(--accent, #60a5fa); }
        .notif-panel-body { overflow-y: auto; flex: 1; max-height: 360px; }
        .notif-item {
            display: flex;
            gap: 10px;
            padding: 10px 14px;
            border-bottom: 1px solid var(--border, #333);
            cursor: pointer;
            transition: background 0.15s;
        }
        .notif-item:hover { background: var(--bg-hover, #333); }
        .notif-item.notif-read { opacity: 0.55; }
        .notif-item-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 2px; }
        .notif-item-content { flex: 1; min-width: 0; }
        .notif-item-title { font-size: 0.82rem; font-weight: 600; margin-bottom: 2px; }
        .notif-item-msg { font-size: 0.75rem; color: var(--text-secondary, #888); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .notif-item-time { font-size: 0.68rem; color: var(--text-muted, #666); }
        .notif-empty { padding: 24px; text-align: center; color: var(--text-secondary, #888); font-size: 0.85rem; }
    `;
    document.head.appendChild(style);
})();
