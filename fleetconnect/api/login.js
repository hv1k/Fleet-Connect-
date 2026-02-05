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

// Demo accounts mapping (role -> email) — credentials stay server-side only
const DEMO_ACCOUNTS = {
    admin: 'admin@fleetconnect.com',
    rental: 'paul@sunbelt.com',
    vendor: 'owner@yourfleet.com',
    fieldworker: 'driver@yourfleet.com'
};

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
        const { email, password, demo, demoRole } = req.body;

        // Handle demo login — no credentials exposed to client
        if (demo && demoRole) {
            const demoEmail = DEMO_ACCOUNTS[demoRole];
            if (!demoEmail) {
                return res.status(400).json({ error: 'Invalid demo role' });
            }

            const { data: user, error } = await supabase
                .from('users')
                .select('id, email, name, role, company, vendor_id, created_at')
                .eq('email', demoEmail)
                .single();

            if (error || !user) {
                return res.status(401).json({ error: 'Demo account not found' });
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role, company: user.company, vendor_id: user.vendor_id },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

            return res.status(200).json({ success: true, token, user });
        }

        // Regular login
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Fetch user by email only (never send password in query)
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if password is hashed (starts with $2) or still plaintext
        let passwordValid = false;
        if (user.password.startsWith('$2')) {
            // Bcrypt hashed password
            passwordValid = await bcrypt.compare(password, user.password);
        } else {
            // Legacy plaintext password (before migration)
            passwordValid = user.password === password;

            // Auto-migrate: hash the plaintext password now
            if (passwordValid) {
                const hashed = await bcrypt.hash(password, 12);
                await supabase
                    .from('users')
                    .update({ password: hashed })
                    .eq('id', user.id);
            }
        }

        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token (never include password)
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, company: user.company, vendor_id: user.vendor_id },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        // Return user data without password
        const safeUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            company: user.company,
            vendor_id: user.vendor_id,
            created_at: user.created_at
        };

        return res.status(200).json({ success: true, token, user: safeUser });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
