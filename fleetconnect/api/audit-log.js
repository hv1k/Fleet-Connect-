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
    // Allow Vercel preview deployments
    if (origin.endsWith('.vercel.app')) return origin;
    return ALLOWED_ORIGINS[0];
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}


// Rate limiting
const RATE_WINDOW_MS = 60000;
const MAX_REQUESTS = 60;
const _rlAttempts = new Map();

function _getRateKey(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
}

function _isRateLimited(key) {
    const now = Date.now();
    const entry = _rlAttempts.get(key);
    if (!entry) return false;
    if (now - entry.first > RATE_WINDOW_MS) { _rlAttempts.delete(key); return false; }
    return entry.count >= MAX_REQUESTS;
}

function _recordRequest(key) {
    const now = Date.now();
    const entry = _rlAttempts.get(key);
    if (!entry || now - entry.first > RATE_WINDOW_MS) { _rlAttempts.set(key, { count: 1, first: now }); return; }
    entry.count += 1;
}

export default async function handler(req, res) {
    const origin = getCorsOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limit check
    const _rk = _getRateKey(req);
    if (_isRateLimited(_rk)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    _recordRequest(_rk);

    if (!JWT_SECRET) {
        return res.status(500).json({ error: 'Server misconfiguration: JWT secret not set' });
    }

    // Extract and verify Bearer token
    const authHeader = req.headers?.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // POST: Write audit log entry
    if (req.method === 'POST') {
        try {
            const { action, targetType, targetId, details } = req.body;

            // Validate required fields
            if (!action || !targetType || !targetId) {
                return res.status(400).json({
                    error: 'Missing required fields: action, targetType, targetId'
                });
            }

            // Get client IP address
            const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] ||
                            req.headers['x-real-ip'] ||
                            req.socket?.remoteAddress ||
                            '';

            const { data, error } = await supabase
                .from('audit_logs')
                .insert([{
                    user_id: decoded.userId,
                    user_name: decoded.email || 'Unknown',
                    action,
                    target_type: targetType,
                    target_id: targetId,
                    details: details || {},
                    ip_address: ipAddress
                }])
                .select()
                .single();

            if (error) {
                console.error('Error writing audit log:', error);
                return res.status(500).json({ error: 'Failed to write audit log' });
            }

            return res.status(201).json({ success: true, log: data });
        } catch (err) {
            console.error('Audit log POST error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET: Read recent audit logs (admin only)
    if (req.method === 'GET') {
        try {
            // Verify admin role
            if (decoded.role !== 'admin') {
                return res.status(403).json({ error: 'Forbidden. Admin access required.' });
            }

            const limit = parseInt(req.query.limit) || 50;
            const maxLimit = 500; // Safety cap

            if (limit < 1 || limit > maxLimit) {
                return res.status(400).json({
                    error: `Limit must be between 1 and ${maxLimit}`
                });
            }

            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Error fetching audit logs:', error);
                return res.status(500).json({ error: 'Failed to fetch audit logs' });
            }

            return res.status(200).json({ success: true, logs: data || [] });
        } catch (err) {
            console.error('Audit log GET error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
