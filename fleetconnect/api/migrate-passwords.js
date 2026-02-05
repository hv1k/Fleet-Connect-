import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
    process.env.SUPABASE_URL || 'https://ojqoxdsibiutpfhtvyyo.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

const MIGRATE_SECRET = process.env.MIGRATE_SECRET || process.env.JWT_SECRET;

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', 'https://fleet-connect-three.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Require secret to run migration
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${MIGRATE_SECRET}`) {
            return res.status(401).json({ error: 'Invalid migration secret' });
        }

        // Fetch all users
        const { data: users, error } = await supabase
            .from('users')
            .select('id, password');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch users: ' + error.message });
        }

        let migrated = 0;
        let alreadyHashed = 0;
        let errors = [];

        for (const user of users) {
            // Skip if already hashed (bcrypt hashes start with $2)
            if (user.password.startsWith('$2')) {
                alreadyHashed++;
                continue;
            }

            try {
                const hashed = await bcrypt.hash(user.password, 12);
                const { error: updateError } = await supabase
                    .from('users')
                    .update({ password: hashed })
                    .eq('id', user.id);

                if (updateError) {
                    errors.push({ userId: user.id, error: updateError.message });
                } else {
                    migrated++;
                }
            } catch (hashErr) {
                errors.push({ userId: user.id, error: hashErr.message });
            }
        }

        return res.status(200).json({
            success: true,
            total: users.length,
            migrated,
            alreadyHashed,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('Migration error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
