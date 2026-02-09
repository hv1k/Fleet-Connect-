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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Admin check
    if (decoded.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    // ==================== GET ====================
    if (req.method === 'GET') {
        try {
            const { type, status } = req.query;

            let query = supabase.from('companies').select('*, users:company_users(id, name, email, role)');

            if (type && type !== 'all') {
                query = query.eq('type', type);
            }

            if (status && status !== 'all') {
                query = query.eq('status', status);
            } else {
                // By default, only show active companies
                query = query.eq('status', 'active');
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching companies:', error);
                return res.status(500).json({ success: false, error: 'Failed to fetch companies' });
            }

            return res.status(200).json({ success: true, companies: data || [] });
        } catch (err) {
            console.error('GET companies error:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // ==================== POST (Create) ====================
    if (req.method === 'POST') {
        try {
            const { name, type, email, phone, address, city, state, zip, website, tax_id, payment_terms, service_areas } = req.body;

            if (!name || !type) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields: name, type'
                });
            }

            const { data, error } = await supabase
                .from('companies')
                .insert([{
                    name,
                    type,
                    email,
                    phone,
                    address,
                    city,
                    state,
                    zip,
                    website,
                    tax_id,
                    payment_terms,
                    service_areas: service_areas || [],
                    status: 'active'
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating company:', error);
                return res.status(500).json({ success: false, error: 'Failed to create company' });
            }

            return res.status(201).json({ success: true, company: data });
        } catch (err) {
            console.error('POST companies error:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // ==================== PUT (Update) ====================
    if (req.method === 'PUT') {
        try {
            const { id, name, type, email, phone, address, city, state, zip, website, tax_id, payment_terms, service_areas } = req.body;

            if (!id) {
                return res.status(400).json({ success: false, error: 'Company ID required' });
            }

            const { data, error } = await supabase
                .from('companies')
                .update({
                    name,
                    type,
                    email,
                    phone,
                    address,
                    city,
                    state,
                    zip,
                    website,
                    tax_id,
                    payment_terms,
                    service_areas: service_areas || []
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating company:', error);
                return res.status(500).json({ success: false, error: 'Failed to update company' });
            }

            return res.status(200).json({ success: true, company: data });
        } catch (err) {
            console.error('PUT companies error:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    // ==================== DELETE (Soft Delete - Set to Inactive) ====================
    if (req.method === 'DELETE') {
        try {
            const { id } = req.body;

            if (!id) {
                return res.status(400).json({ success: false, error: 'Company ID required' });
            }

            const { data, error } = await supabase
                .from('companies')
                .update({ status: 'inactive' })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error deactivating company:', error);
                return res.status(500).json({ success: false, error: 'Failed to deactivate company' });
            }

            return res.status(200).json({ success: true, company: data });
        } catch (err) {
            console.error('DELETE companies error:', err);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}
