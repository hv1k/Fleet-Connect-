import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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
        if (!JWT_SECRET) {
            return res.status(500).json({ error: 'Server misconfiguration: JWT secret not set' });
        }
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}


// Rate limiting
const RATE_WINDOW_MS = 60000;
const MAX_REQUESTS = 30;
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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // Rate limit check
    const _rk = _getRateKey(req);
    if (_isRateLimited(_rk)) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    _recordRequest(_rk);
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Verify the requesting user is an admin
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = verifyToken(authHeader.split(' ')[1]);
        if (!decoded || decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        // Special action: migrate plaintext passwords to bcrypt
        const { action } = req.body;
        if (action === 'migrate-passwords') {
            const { data: users, error: fetchError } = await supabase
                .from('users')
                .select('id, password');
            if (fetchError) {
                return res.status(500).json({ error: 'Failed to fetch users', details: fetchError.message });
            }
            let migratedCount = 0;
            for (const user of users) {
                if (user.password && user.password.startsWith('$2')) continue;
                const hashed = await bcrypt.hash(user.password, 12);
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ password: hashed })
                    .eq('id', user.id);
                if (updateError) { console.error(`Failed to migrate user ${user.id}:`, updateError.message); continue; }
                migratedCount++;
            }
            return res.status(200).json({ success: true, migrated: migratedCount, total: users.length });
        }

        // Regular user update flow
        const { userId, email, password, name, role, company, vendor_id } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Build update object
        const updateData = {};

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            // Check if email already taken by another user
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase().trim())
                .neq('id', userId)
                .single();

            if (existing) {
                return res.status(409).json({ error: 'A user with this email already exists' });
            }
            updateData.email = email.toLowerCase().trim();
        }

        if (password) {
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }
            updateData.password = await bcrypt.hash(password, 12);
        }

        if (name) updateData.name = name.trim();
        if (role) {
            const validRoles = ['admin', 'vendor', 'rental', 'fieldworker'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }
            updateData.role = role;
        }

        if (company !== undefined) updateData.company = company || null;
        if (vendor_id !== undefined) updateData.vendor_id = vendor_id || null;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, email, name, role, company, vendor_id, created_at')
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return res.status(500).json({ error: 'Failed to update user: ' + error.message });
        }

        return res.status(200).json({ success: true, user });
    } catch (err) {
        console.error('Update user error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
