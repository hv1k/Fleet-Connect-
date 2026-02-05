import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'fleetconnect-dev-secret-change-in-production';
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
    } catch {
        return null;
    }
}

export default async function handler(req, res) {
    const origin = getCorsOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();
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
