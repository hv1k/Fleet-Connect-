import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

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

export default async function handler(req, res) {
    const origin = getCorsOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { token, newPassword } = req.body;

        // Validate inputs
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing reset token'
            });
        }

        if (!newPassword || typeof newPassword !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'New password is required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters'
            });
        }

        // Look up user by reset token
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, reset_token, reset_token_expires')
            .eq('reset_token', token)
            .single();

        if (fetchError || !user) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired reset link'
            });
        }

        // Check if token is expired
        const expiresAt = new Date(user.reset_token_expires);
        const now = new Date();

        if (now > expiresAt) {
            return res.status(400).json({
                success: false,
                error: 'Reset link has expired. Please request a new one.'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and clear reset token fields
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password: hashedPassword,
                reset_token: null,
                reset_token_expires: null
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating password:', updateError);
            return res.status(500).json({
                success: false,
                error: 'Failed to reset password. Please try again.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
}
