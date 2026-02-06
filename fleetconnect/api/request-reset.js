import { createClient } from '@supabase/supabase-js';
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

// Basic in-memory rate limiting (best-effort)
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
        const { email } = req.body;

        // Validate input
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

        // Always return success message even if email not found (security best practice)
        if (userExists) {
            try {
                // Generate random reset token (store hash only)
                const resetToken = crypto.randomBytes(32).toString('hex');
                const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

                // Store token hash and expiry on user record
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        reset_token: resetTokenHash,
                        reset_token_expires: expiresAt.toISOString()
                    })
                    .eq('id', userId);

                if (updateError) {
                    console.error('Error storing reset token:', updateError);
                } else {
                    // TODO: Send reset email containing the plain token link.
                    // Example: https://your-domain/reset-password.html?token=${resetToken}
                }
            } catch (err) {
                console.error('Error generating reset token:', err);
            }
        }

        recordAttempt(rateKey);

        // Always return generic success response
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Password reset request error:', err);
        return res.status(200).json({ success: true });
    }
}
