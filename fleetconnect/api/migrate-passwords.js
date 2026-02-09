// api/migrate-passwords.js — One-time admin endpoint to migrate plaintext passwords to bcrypt
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const BCRYPT_ROUNDS = 12;
const RATE_LIMIT_MS = 60000; // 1 minute
let lastCallTimestamp = 0;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit: 1 call per minute
  const now = Date.now();
  if (now - lastCallTimestamp < RATE_LIMIT_MS) {
    return res.status(429).json({ error: 'Rate limited. Try again in 1 minute.' });
  }

  // JWT auth
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Require admin role
  if (decoded.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  lastCallTimestamp = now;

  try {
    // Fetch all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, password');

    if (fetchError) {
      return res.status(500).json({ error: 'Failed to fetch users', details: fetchError.message });
    }

    let migratedCount = 0;

    for (const user of users) {
      // Skip if already bcrypt-hashed (starts with $2)
      if (user.password && user.password.startsWith('$2')) {
        continue;
      }

      // Hash the plaintext password
      const hashed = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashed })
        .eq('id', user.id);

      if (updateError) {
        console.error(`Failed to migrate user ${user.id}:`, updateError.message);
        continue;
      }

      migratedCount++;
    }

    return res.status(200).json({
      success: true,
      migrated: migratedCount,
      total: users.length
    });
  } catch (err) {
    return res.status(500).json({ error: 'Migration failed', details: err.message });
  }
};
