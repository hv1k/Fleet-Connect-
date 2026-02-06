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
    // Allow Vercel preview deployments
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
        // Extract and verify JWT token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const userId = decoded.userId;
        const { currentPassword, newPassword } = req.body;

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }

        // Fetch user from database
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, password')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            console.error('Error fetching user:', fetchError);
            return res.status(401).json({ error: 'User not found' });
        }

        // Verify current password
        let passwordValid = false;

        // Check if password is hashed (starts with $2) or plaintext
        if (user.password.startsWith('$2')) {
            // Bcrypt hashed password
            passwordValid = await bcrypt.compare(currentPassword, user.password);
        } else {
            // Legacy plaintext password (before migration)
            passwordValid = user.password === currentPassword;

            // Auto-migrate: hash the plaintext password now
            if (passwordValid) {
                const hashed = await bcrypt.hash(user.password, 12);
                await supabase
                    .from('users')
                    .update({ password: hashed })
                    .eq('id', userId);
            }
        }

        if (!passwordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

        // Update password in database
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedNewPassword })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating password:', updateError);
            return res.status(500).json({ error: 'Failed to update password' });
        }

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (err) {
        console.error('Change password error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
