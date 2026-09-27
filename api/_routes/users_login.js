import { getDb } from '../_db.js';
import { signToken, setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) { body = {}; }
  }
  const { email } = body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  const cleanEmail = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const sql = getDb();
  try {
    // 1. Try finding existing user
    let rows = await sql`SELECT * FROM users WHERE email=${cleanEmail}`;
    if (!rows || rows.length === 0) {
      // Auto-create account so user is never blocked
      const fallbackName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
      rows = await sql`
        INSERT INTO users (email, name)
        VALUES (${cleanEmail}, ${formattedName})
        ON CONFLICT (email) DO UPDATE SET updated_at=NOW()
        RETURNING *
      `;
    }
    const u = rows[0];
    const token = signToken({ userId: u.id, email: u.email, name: u.name });
    return res.status(200).json({
      token,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        age: u.age,
        occupation: u.occupation,
        coin_balance: Number(u.coin_balance || 0),
        base_coins: Number(u.base_coins || 0),
        bonus_coins: Number(u.bonus_coins || 0),
        joined_at: u.joined_at,
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ error: err.message });
  }
}
