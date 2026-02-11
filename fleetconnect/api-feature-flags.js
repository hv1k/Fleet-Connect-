import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;
const ALLOWED_ORIGINS = [
    'https://fleet-connect-three.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
];

function getCorsOrigin(req) {
    const origin = req.headers?.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (origin.endsWith('.vercel.app')) return origin;
    return ALLOWED_ORIGINS[0];
}

function verifyToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        return jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch { return null; }
}

// Default feature flags — used to seed the table if empty
const DEFAULT_FLAGS = [
    // ===== VENDOR PAGE FLAGS =====
    { role: 'vendor', feature_key: 'page.work_orders', label: 'Work Orders', description: 'Work orders list and management', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.create_job', label: 'Create Work Order', description: 'Create new work orders', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.daily_log', label: 'Daily Log', description: 'Daily delivery log and tracking', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.dispatch', label: 'Dispatch Board', description: 'Kanban-style job dispatch management', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.route_optimization', label: 'Route Optimization', description: 'Map-based route planning and optimization', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.worker_metrics', label: 'Worker Metrics', description: 'Field worker performance tracking', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.inventory', label: 'Inventory', description: 'Fuel and equipment inventory management', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.invoices', label: 'Invoices', description: 'Invoice management and QB matching', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.payments', label: 'Payments', description: 'Payment tracking and history', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.profitability', label: 'Profitability', description: 'Revenue and margin analytics', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.subcontractors', label: 'Subcontractors', description: 'Subcontractor management', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.job_bidding', label: 'Job Bidding', description: 'Bid on available jobs', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.sla', label: 'SLA Management', description: 'Service level agreement tracking', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.messages', label: 'Messages', description: 'In-app messaging and chat', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.documents', label: 'Documents', description: 'Document storage and management', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.fuel_calculator', label: 'Fuel Calculator', description: 'Fuel cost and volume calculator', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.equipment', label: 'Equipment Tracking', description: 'Equipment location and status tracking', category: 'pages', enabled: true },
    { role: 'vendor', feature_key: 'page.alerts', label: 'Alerts', description: 'Alert configuration and notifications', category: 'pages', enabled: true },
    // Vendor analytics/features
    { role: 'vendor', feature_key: 'charts.fuel', label: 'Fuel Delivery Chart', description: 'Bar chart showing diesel and DEF deliveries by day of week', category: 'analytics', enabled: true },
    { role: 'vendor', feature_key: 'charts.jobs', label: 'Job Status Chart', description: 'Donut chart showing job completion breakdown', category: 'analytics', enabled: true },
    { role: 'vendor', feature_key: 'activity_feed', label: 'Activity Feed', description: 'Real-time activity feed showing recent invoices, completions, and alerts', category: 'analytics', enabled: true },
    { role: 'vendor', feature_key: 'stats.revenue', label: 'Revenue Stats', description: 'Show revenue and financial metrics on dashboard (premium)', category: 'analytics', enabled: false },
    { role: 'vendor', feature_key: 'worker_stats', label: 'Worker Performance', description: 'Field worker completion stats and performance metrics (premium)', category: 'analytics', enabled: false },
    { role: 'vendor', feature_key: 'invoices.qb', label: 'QuickBooks Integration', description: 'QuickBooks invoice import and matching on Invoices page', category: 'features', enabled: false },
    { role: 'vendor', feature_key: 'invoices.export', label: 'Invoice Export', description: 'Export invoice data to Excel spreadsheets', category: 'features', enabled: true },
    { role: 'vendor', feature_key: 'daily_log.export', label: 'Daily Log Export', description: 'Export daily log data to Excel and PDF', category: 'features', enabled: true },
    { role: 'vendor', feature_key: 'onboarding', label: 'Onboarding Tutorial', description: 'Interactive welcome tutorial for new users', category: 'features', enabled: true },
    { role: 'vendor', feature_key: 'map_view', label: 'Map View', description: 'View job locations on a map from work orders', category: 'features', enabled: true },

    // ===== RENTAL PAGE FLAGS =====
    { role: 'rental', feature_key: 'page.create_job', label: 'Create Work Order', description: 'Create new work orders', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.work_orders', label: 'Work Orders', description: 'Work orders list and management', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.invoices', label: 'Invoices', description: 'Invoice and fuel history review', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.contracts', label: 'Contracts', description: 'Contract management and tracking', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.equipment', label: 'Equipment Tracking', description: 'Equipment location and status tracking', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.vendor_comparison', label: 'Vendor Comparison', description: 'Compare and search vendors', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.recurring_jobs', label: 'Recurring Jobs', description: 'Manage recurring job schedules', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.reports', label: 'Reports', description: 'Reports and analytics', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.daily_log', label: 'Daily Log', description: 'Daily delivery log', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.documents', label: 'Documents', description: 'Document storage', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.bulk_import', label: 'Bulk Import', description: 'CSV/Excel bulk job import', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.messages', label: 'Messages', description: 'In-app messaging', category: 'pages', enabled: true },
    { role: 'rental', feature_key: 'page.alerts', label: 'Alerts', description: 'Alert configuration', category: 'pages', enabled: true },
    // Rental analytics/features
    { role: 'rental', feature_key: 'charts.overview', label: 'Dashboard Charts', description: 'Overview charts showing orders and completion trends', category: 'analytics', enabled: true },
    { role: 'rental', feature_key: 'activity_feed', label: 'Activity Feed', description: 'Real-time activity feed on dashboard', category: 'analytics', enabled: true },
    { role: 'rental', feature_key: 'reporting.export', label: 'Report Export', description: 'Export reports and data to spreadsheets', category: 'features', enabled: true },
    { role: 'rental', feature_key: 'onboarding', label: 'Onboarding Tutorial', description: 'Interactive welcome tutorial for new users', category: 'features', enabled: true },

    // ===== FIELD WORKER PAGE FLAGS =====
    { role: 'fieldworker', feature_key: 'page.work_orders', label: 'Work Orders', description: 'Work orders list', category: 'pages', enabled: true },
    { role: 'fieldworker', feature_key: 'page.time_tracking', label: 'Time Tracking', description: 'Clock in/out and time logging', category: 'pages', enabled: true },
    { role: 'fieldworker', feature_key: 'page.messages', label: 'Messages', description: 'In-app messaging', category: 'pages', enabled: true },
    { role: 'fieldworker', feature_key: 'page.documents', label: 'Documents', description: 'Document storage', category: 'pages', enabled: true },
    { role: 'fieldworker', feature_key: 'page.fuel_calculator', label: 'Fuel Calculator', description: 'Fuel cost calculator', category: 'pages', enabled: true },
    // Field Worker features
    { role: 'fieldworker', feature_key: 'invoice_creation', label: 'Create Invoices', description: 'Ability to create and submit invoices from job cards', category: 'features', enabled: true },
    { role: 'fieldworker', feature_key: 'navigation', label: 'Turn-by-Turn Navigation', description: 'Navigate button on job cards for directions to job sites', category: 'features', enabled: true },
    { role: 'fieldworker', feature_key: 'signature', label: 'Digital Signature', description: 'Site contact signature capture on invoice submission', category: 'features', enabled: true },
    { role: 'fieldworker', feature_key: 'onboarding', label: 'Onboarding Tutorial', description: 'Interactive welcome tutorial for new users', category: 'features', enabled: true },
];

async function ensureTable() {
    // Check if table has data
    const { data, error } = await supabase
        .from('feature_flags')
        .select('role, feature_key')
        .limit(500);

    if (error) {
        console.warn('[FeatureFlags] Table check failed:', error.message);
        return false;
    }

    // If empty, seed all defaults
    if (!data || data.length === 0) {
        const { error: seedError } = await supabase
            .from('feature_flags')
            .insert(DEFAULT_FLAGS);

        if (seedError) {
            console.error('[FeatureFlags] Seed failed:', seedError.message);
            return false;
        }
        console.log('[FeatureFlags] Seeded default flags');
    } else {
        // Insert any missing flags (new ones added in updates)
        const existing = new Set(data.map(f => f.role + '::' + f.feature_key));
        const missing = DEFAULT_FLAGS.filter(f => !existing.has(f.role + '::' + f.feature_key));
        if (missing.length > 0) {
            const { error: insertError } = await supabase
                .from('feature_flags')
                .insert(missing);
            if (insertError) {
                console.warn('[FeatureFlags] Failed to insert missing flags:', insertError.message);
            } else {
                console.log('[FeatureFlags] Inserted', missing.length, 'new flags');
            }
        }
    }

    return true;
}

export default async function handler(req, res) {
    const origin = getCorsOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Verify JWT
    const decoded = verifyToken(req);
    if (!decoded) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    // Ensure table exists and is seeded
    await ensureTable();

    // ==================== GET ====================
    if (req.method === 'GET') {
        const { role, admin } = req.query;
        const tableReady = await ensureTable();

        // Admin mode: return ALL flags for all roles
        if (admin === 'true') {
            if (decoded.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Admin access required' });
            }

            if (!tableReady) {
                // Return defaults when table doesn't exist
                return res.status(200).json({ success: true, flags: DEFAULT_FLAGS });
            }

            const { data, error } = await supabase
                .from('feature_flags')
                .select('*')
                .order('role')
                .order('category')
                .order('feature_key');

            if (error) {
                return res.status(200).json({ success: true, flags: DEFAULT_FLAGS });
            }

            return res.status(200).json({ success: true, flags: data || DEFAULT_FLAGS });
        }

        // Regular mode: return flags for a specific role as a flat object
        const targetRole = role || decoded.role;

        if (!tableReady) {
            // Return defaults for the role
            const flags = {};
            DEFAULT_FLAGS.filter(f => f.role === targetRole).forEach(f => { flags[f.feature_key] = f.enabled; });
            return res.status(200).json({ success: true, flags });
        }

        const { data, error } = await supabase
            .from('feature_flags')
            .select('feature_key, enabled')
            .eq('role', targetRole);

        if (error) {
            // Fallback to defaults
            const flags = {};
            DEFAULT_FLAGS.filter(f => f.role === targetRole).forEach(f => { flags[f.feature_key] = f.enabled; });
            return res.status(200).json({ success: true, flags });
        }

        // Convert to { key: boolean } map
        const flags = {};
        (data || []).forEach(f => { flags[f.feature_key] = f.enabled; });

        return res.status(200).json({ success: true, flags });
    }

    // ==================== POST (admin only) ====================
    if (req.method === 'POST') {
        if (decoded.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { role, feature_key, enabled } = req.body;

        if (!role || !feature_key || typeof enabled !== 'boolean') {
            return res.status(400).json({ success: false, error: 'Missing required fields: role, feature_key, enabled' });
        }

        // Upsert the flag
        const { data, error } = await supabase
            .from('feature_flags')
            .upsert({
                role,
                feature_key,
                enabled,
                updated_at: new Date().toISOString()
            }, { onConflict: 'role,feature_key' })
            .select()
            .single();

        if (error) {
            console.error('[FeatureFlags] Update failed:', error);
            return res.status(500).json({ success: false, error: 'Failed to update flag' });
        }

        return res.status(200).json({ success: true, flag: data });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
