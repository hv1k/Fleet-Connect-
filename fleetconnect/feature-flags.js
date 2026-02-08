/**
 * FleetConnect Feature Flags Client
 * Manages per-role feature toggles controlled by admin.
 * Usage:
 *   await FC_FLAGS.init('vendor');
 *   if (FC_FLAGS.isOn('page.invoices')) { ... }
 *   FC_FLAGS.hide('charts.fuel', '#fuelChartCard');
 *   FC_FLAGS.hideNav('page.invoices', 'invoices.html');
 */
window.FC_FLAGS = {
    _flags: {},
    _role: null,
    _loaded: false,
    _cacheKey: 'fc_feature_flags',
    _cacheTTL: 10 * 60 * 1000, // 10 minutes

    /**
     * Initialize feature flags for a role.
     * Checks sessionStorage cache first, then fetches from API.
     */
    async init(role) {
        if (!role) return;
        this._role = role;

        // Admin role: all features always on, no need to fetch
        if (role === 'admin') {
            this._loaded = true;
            return;
        }

        // Check cache
        const cached = this._getCache();
        if (cached && cached.role === role) {
            this._flags = cached.flags;
            this._loaded = true;
            this._applyAll();
            return;
        }

        // Fetch from API
        try {
            const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
            const headers = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const res = await fetch('/api/feature-flags?role=' + encodeURIComponent(role), { headers });
            const data = await res.json();

            if (data.success && data.flags) {
                this._flags = data.flags;
                this._setCache(role, data.flags);
            }
        } catch (err) {
            console.warn('[FeatureFlags] Failed to load, using defaults:', err.message);
        }

        this._loaded = true;
        this._applyAll();
    },

    /**
     * Check if a feature is enabled.
     * Returns true by default if flag is unknown (safe fallback = show).
     */
    isOn(key) {
        // Admin always has everything on
        if (this._role === 'admin') return true;
        // If flag exists, use it; otherwise default to true (show by default)
        if (key in this._flags) return this._flags[key];
        return true;
    },

    /**
     * Check if a feature is explicitly disabled.
     */
    isOff(key) {
        return !this.isOn(key);
    },

    /**
     * Hide an element if its feature flag is OFF.
     * @param {string} key - Feature flag key
     * @param {string|Element} target - CSS selector or DOM element
     */
    hide(key, target) {
        if (this.isOn(key)) return;
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (el) el.style.display = 'none';
    },

    /**
     * Hide a sidebar navigation link by matching its href.
     * @param {string} key - Feature flag key
     * @param {string} href - The href to match (e.g., 'invoices.html')
     */
    hideNav(key, href) {
        if (this.isOn(key)) return;
        const links = document.querySelectorAll('a[href*="' + href + '"]');
        links.forEach(link => {
            // Hide the nav item (link or its parent .nav-item)
            const navItem = link.closest('.nav-item') || link;
            navItem.style.display = 'none';
        });
    },

    /**
     * Apply visibility to multiple elements.
     * @param {Object} map - { featureKey: selectorOrElement }
     */
    applyMap(map) {
        Object.entries(map).forEach(([key, target]) => this.hide(key, target));
    },

    /**
     * Apply nav hiding to multiple links.
     * @param {Object} map - { featureKey: href }
     */
    applyNavMap(map) {
        Object.entries(map).forEach(([key, href]) => this.hideNav(key, href));
    },

    /**
     * Gate an entire page. If the flag is OFF, shows a message and redirects.
     * @param {string} key - Feature flag key
     * @param {string} redirectUrl - URL to redirect to
     * @param {string} message - Optional message to show
     * @returns {boolean} true if page is allowed, false if gated
     */
    gatePage(key, redirectUrl, message) {
        if (this.isOn(key)) return true;

        // Show brief message then redirect
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#1a1a1a;color:#f5f0e8;font-family:'Inter',sans-serif;">
                <div style="text-align:center;max-width:400px;padding:40px;">
                    <div style="font-size:3rem;margin-bottom:16px;">🔒</div>
                    <h2 style="margin-bottom:12px;font-size:1.3rem;">Feature Not Available</h2>
                    <p style="color:#888;font-size:0.9rem;margin-bottom:24px;">${message || 'This feature is not enabled for your account. Contact your administrator to enable it.'}</p>
                    <a href="${redirectUrl}" style="color:#3b82f6;text-decoration:none;font-weight:600;">← Go Back</a>
                </div>
            </div>
        `;
        return false;
    },

    /**
     * Get all flags (for admin UI).
     */
    async getAllFlags() {
        try {
            const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
            const headers = {};
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const res = await fetch('/api/feature-flags?admin=true', { headers });
            const data = await res.json();
            return data.success ? data.flags : [];
        } catch (err) {
            console.error('[FeatureFlags] Failed to load all flags:', err);
            return [];
        }
    },

    /**
     * Update a flag (admin only).
     */
    async updateFlag(role, featureKey, enabled) {
        try {
            const token = typeof getAuthToken === 'function' ? getAuthToken() : null;
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const res = await fetch('/api/feature-flags', {
                method: 'POST',
                headers,
                body: JSON.stringify({ role, feature_key: featureKey, enabled })
            });
            const data = await res.json();
            return data.success;
        } catch (err) {
            console.error('[FeatureFlags] Failed to update flag:', err);
            return false;
        }
    },

    /**
     * Clear the cache (useful when admin changes flags).
     */
    clearCache() {
        try { sessionStorage.removeItem(this._cacheKey); } catch (e) {}
    },

    // ---- Internal ----

    _getCache() {
        try {
            const raw = sessionStorage.getItem(this._cacheKey);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (Date.now() - cached.ts > this._cacheTTL) return null;
            return cached;
        } catch (e) { return null; }
    },

    _setCache(role, flags) {
        try {
            sessionStorage.setItem(this._cacheKey, JSON.stringify({
                role, flags, ts: Date.now()
            }));
        } catch (e) {}
    },

    _pendingHides: [],
    _pendingNavHides: [],

    _applyAll() {
        // Apply any deferred hide calls
        this._pendingHides.forEach(([key, target]) => this.hide(key, target));
        this._pendingNavHides.forEach(([key, href]) => this.hideNav(key, href));
        this._pendingHides = [];
        this._pendingNavHides = [];
    }
};
