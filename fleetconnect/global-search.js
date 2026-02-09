// Global Search - Search across jobs, users, and invoices
(function() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (!sidebar) return;

    // Insert search bar HTML after logo
    const logo = sidebar.querySelector('.admin-sidebar-logo');
    if (!logo) return;

    const searchContainer = document.createElement('div');
    searchContainer.className = 'global-search-container';
    searchContainer.innerHTML = `
        <div class="global-search-wrapper">
            <span class="global-search-icon">🔍</span>
            <input type="text" class="global-search-input" placeholder="Search jobs, users, invoices..." autocomplete="off">
        </div>
        <div class="global-search-results" style="display:none;"></div>
    `;
    logo.insertAdjacentElement('afterend', searchContainer);

    const input = searchContainer.querySelector('.global-search-input');
    const resultsDiv = searchContainer.querySelector('.global-search-results');
    let debounceTimer = null;

    input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        if (query.length < 2) {
            resultsDiv.style.display = 'none';
            return;
        }
        debounceTimer = setTimeout(function() { performSearch(query); }, 300);
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            resultsDiv.style.display = 'none';
            input.blur();
        } else if (e.key === 'Enter') {
            const firstLink = resultsDiv.querySelector('.global-search-result-item');
            if (firstLink) firstLink.click();
        }
    });

    document.addEventListener('click', function(e) {
        if (!searchContainer.contains(e.target)) {
            resultsDiv.style.display = 'none';
        }
    });

    async function performSearch(query) {
        if (typeof db === 'undefined') return;

        const q = query.toLowerCase();
        const results = { jobs: [], users: [], invoices: [] };

        try {
            // Search jobs
            const { data: jobs } = await db.from('jobs').select('id, title, description, status, location, site_name').or(`title.ilike.%${q}%,description.ilike.%${q}%,status.ilike.%${q}%,location.ilike.%${q}%,site_name.ilike.%${q}%`).limit(5);
            if (jobs) results.jobs = jobs;
        } catch(e) {}

        try {
            // Search users
            const { data: users } = await db.from('users').select('id, name, email, role').or(`name.ilike.%${q}%,email.ilike.%${q}%`).limit(5);
            if (users) results.users = users;
        } catch(e) {}

        try {
            // Search invoices
            const { data: invoices } = await db.from('qb_invoices').select('id, invoice_number, vendor_name, description, total_amount').or(`invoice_number.ilike.%${q}%,vendor_name.ilike.%${q}%,description.ilike.%${q}%`).limit(5);
            if (invoices) results.invoices = invoices;
        } catch(e) {}

        renderResults(results);
    }

    function renderResults(results) {
        const total = results.jobs.length + results.users.length + results.invoices.length;
        if (total === 0) {
            resultsDiv.innerHTML = '<div class="global-search-empty">No results found</div>';
            resultsDiv.style.display = 'block';
            return;
        }

        let html = '';

        if (results.jobs.length > 0) {
            html += '<div class="global-search-category">Jobs</div>';
            results.jobs.forEach(function(job) {
                const title = job.title || job.site_name || 'Untitled Job';
                html += `<a href="work-orders.html" class="global-search-result-item">
                    <span class="global-search-result-icon">📋</span>
                    <div><div class="global-search-result-title">${escapeHtml(title)}</div>
                    <div class="global-search-result-sub">${escapeHtml(job.status || '')}</div></div>
                </a>`;
            });
        }

        if (results.users.length > 0) {
            html += '<div class="global-search-category">Users</div>';
            results.users.forEach(function(user) {
                html += `<a href="admin-dashboard.html" class="global-search-result-item">
                    <span class="global-search-result-icon">👤</span>
                    <div><div class="global-search-result-title">${escapeHtml(user.name)}</div>
                    <div class="global-search-result-sub">${escapeHtml(user.email)} · ${escapeHtml(user.role)}</div></div>
                </a>`;
            });
        }

        if (results.invoices.length > 0) {
            html += '<div class="global-search-category">Invoices</div>';
            results.invoices.forEach(function(inv) {
                const title = inv.invoice_number || inv.vendor_name || 'Invoice';
                const sub = inv.total_amount ? '$' + Number(inv.total_amount).toFixed(2) : '';
                html += `<a href="invoices.html" class="global-search-result-item">
                    <span class="global-search-result-icon">🧾</span>
                    <div><div class="global-search-result-title">${escapeHtml(title)}</div>
                    <div class="global-search-result-sub">${escapeHtml(inv.vendor_name || '')} ${sub}</div></div>
                </a>`;
            });
        }

        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        .global-search-container { position: relative; padding: 0 4px; margin-bottom: 16px; }
        .global-search-wrapper { position: relative; display: flex; align-items: center; }
        .global-search-icon { position: absolute; left: 10px; font-size: 0.85rem; pointer-events: none; }
        .global-search-input {
            width: 100%;
            padding: 9px 12px 9px 32px;
            font-family: 'Inter', sans-serif;
            font-size: 0.82rem;
            background: var(--bg-input, #2a2a2a);
            border: 1px solid var(--border, #333);
            border-radius: 8px;
            color: var(--text-primary, #f5f0e8);
            outline: none;
            transition: border-color 0.2s;
        }
        .global-search-input:focus { border-color: var(--accent, #60a5fa); }
        .global-search-input::placeholder { color: var(--text-muted, #666); }
        .global-search-results {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--bg-card, #242424);
            border: 1px solid var(--border, #333);
            border-radius: 8px;
            margin-top: 4px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 300;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }
        .global-search-category {
            padding: 8px 12px 4px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted, #666);
        }
        .global-search-result-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            text-decoration: none;
            color: var(--text-primary, #f5f0e8);
            transition: background 0.15s;
            cursor: pointer;
        }
        .global-search-result-item:hover { background: var(--bg-hover, #333); }
        .global-search-result-icon { font-size: 1rem; flex-shrink: 0; }
        .global-search-result-title { font-size: 0.82rem; font-weight: 500; }
        .global-search-result-sub { font-size: 0.72rem; color: var(--text-secondary, #888); }
        .global-search-empty { padding: 16px; text-align: center; color: var(--text-secondary, #888); font-size: 0.85rem; }
    `;
    document.head.appendChild(style);
})();
