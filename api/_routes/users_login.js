import { getDb } from '../_db.js';
import { signToken, setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email required' });
  const cleanEmail = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ error: 'Invalid email' });

  const sql = getDb();
  try {
    const rows = await sql`SELECT * FROM users WHERE email=${cleanEmail}`;
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email. Please join beta first.' });
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
    return res.status(500).json({ error: err.message });
  }
}
