import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

// Basic in-memory rate limiting for reset requests (best-effort)
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map();

function getRateKey(req, email) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown';
    return `${ip}:${(email || '').toLowerCase()}`;
}

function isRateLimited(key) {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry) return false;
    if (now - entry.first > RATE_WINDOW_MS) {
        attempts.delete(key);
        return false;
    }
    return entry.count >= MAX_ATTEMPTS;
}

function recordAttempt(key) {
    const now = Date.now();
    const entry = attempts.get(key);
    if (!entry || now - entry.first > RATE_WINDOW_MS) {
        attempts.set(key, { count: 1, first: now });
        return;
    }
    entry.count += 1;
}

function getCorsOrigin(req) {
    const origin = req.headers?.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (origin.endsWith('.vercel.app')) return origin;
    return ALLOWED_ORIGINS[0];
}

// ==================== REQUEST RESET (email only) ====================
async function handleRequestReset(req, res) {
    try {
        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email is required' });
        }

        const rateKey = getRateKey(req, email);
        if (isRateLimited(rateKey)) {
            return res.status(429).json({ success: true });
        }

        // Look up user by email
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, email')
            .ilike('email', email)
            .single();

        let userExists = false;
        let userId = null;

        if (user && !fetchError) {
            userExists = true;
            userId = user.id;
        }

        // Always return success even if email not found (security best practice)
        if (userExists) {
            try {
                const resetToken = crypto.randomBytes(32).toString('hex');
                const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1);

                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        reset_token: resetTokenHash,
                        reset_token_expires: expiresAt.toISOString()
                    })
                    .eq('id', userId);

                if (updateError) {
                    console.error('Error storing reset token:', updateError);
                }
                // TODO: Send reset email with link containing resetToken
            } catch (err) {
                console.error('Error generating reset token:', err);
            }
        }

        recordAttempt(rateKey);
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Password reset request error:', err);
        return res.status(200).json({ success: true });
    }
}

// ==================== COMPLETE RESET (token + newPassword) ====================
async function handleResetPassword(req, res) {
    try {
        const { token, newPassword } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ success: false, error: 'Invalid or missing reset token' });
        }
        if (!newPassword || typeof newPassword !== 'string') {
            return res.status(400).json({ success: false, error: 'New password is required' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, reset_token, reset_token_expires')
            .eq('reset_token', tokenHash)
            .single();

        if (fetchError || !user) {
            return res.status(400).json({ success: false, error: 'Invalid or expired reset link' });
        }

        const expiresAt = new Date(user.reset_token_expires);
        if (new Date() > expiresAt) {
            return res.status(400).json({ success: false, error: 'Reset link has expired. Please request a new one.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

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
            return res.status(500).json({ success: false, error: 'Failed to reset password. Please try again.' });
        }

        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// ==================== MAIN HANDLER ====================
export default async function handler(req, res) {
    const origin = getCorsOrigin(req);
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Route based on request body:
    // - { email } → request reset flow
    // - { token, newPassword } → complete reset flow
    const { email, token } = req.body || {};

    if (email && !token) {
        return handleRequestReset(req, res);
    }

    return handleResetPassword(req, res);
}
