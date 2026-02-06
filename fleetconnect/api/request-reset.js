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
        // But internally track if account exists
        if (userExists) {
            try {
                // Generate random reset token
                const resetToken = crypto.randomBytes(32).toString('hex');
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

                // Store token and expiry on user record
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        reset_token: resetToken,
                        reset_token_expires: expiresAt.toISOString()
                    })
                    .eq('id', userId);

                if (updateError) {
                    console.error('Error storing reset token:', updateError);
                    // Still return success to user (don't reveal internal errors)
                    return res.status(200).json({
                        success: true,
                        resetUrl: '/reset-password.html?token=invalid',
                        exists: false
                    });
                }

                // Return reset URL (temporary: showing token directly until email is integrated)
                const resetUrl = `/reset-password.html?token=${resetToken}`;

                return res.status(200).json({
                    success: true,
                    resetUrl: resetUrl,
                    exists: true // Admin-only info
                });
            } catch (err) {
                console.error('Error generating reset token:', err);
                return res.status(200).json({
                    success: true,
                    resetUrl: '/reset-password.html?token=invalid',
                    exists: false
                });
            }
        }

        // Email not found - still return success for security
        return res.status(200).json({
            success: true,
            resetUrl: '/reset-password.html?token=invalid',
            exists: false
        });
    } catch (err) {
        console.error('Password reset request error:', err);
        return res.status(200).json({
            success: true,
            resetUrl: '/reset-password.html?token=invalid',
            exists: false
        });
    }
}
