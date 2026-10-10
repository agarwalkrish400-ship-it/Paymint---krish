import { getDb } from '../_db.js';
import { authUser, setCorsHeaders } from '../_auth.js';
export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') {
    const payload = authUser(req);
    if (!payload) return res.status(401).json({ error: 'Unauthorised' });
    const sql = getDb();
    try {
      const rows = await sql`SELECT id, brand, label, code, coins_spent, redeemed_at FROM reward_redemptions WHERE user_id=${payload.userId} ORDER BY redeemed_at DESC`;
      return res.status(200).json(rows.map(r => ({
        id: r.id,
        brand: r.brand,
        label: r.label,
        code: r.code,
        coins_spent: Number(r.coins_spent),
        redeemed_at: r.redeemed_at
      })));
    } catch (err) {
      console.error('[/api/rewards/claim GET]', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const payload = authUser(req);
  if (!payload) return res.status(401).json({ error: 'Unauthorised' });
  const { brand, label, cost_coins } = req.body || {};
  if (!brand || !label) return res.status(400).json({ error: 'brand and label required' });
  const sql = getDb();
  try {
    const costRows = await sql`SELECT cost_coins FROM rewards WHERE brand=${brand} AND label=${label} AND active=true AND stock>0 LIMIT 1`;
    let cost = costRows.length ? Number(costRows[0].cost_coins) : Number(cost_coins);
    if (!cost || isNaN(cost) || cost <= 0) {
      return res.status(400).json({ error: 'Valid cost_coins or catalog reward required' });
    }
    cost = parseFloat(cost.toFixed(1));

    const userRows = await sql`SELECT coin_balance FROM users WHERE id=${payload.userId}`;
    if (!userRows.length) return res.status(404).json({ error: 'User not found' });
    const currentBalance = Number(userRows[0].coin_balance || 0);

    if (currentBalance < cost) {
      return res.status(400).json({ error: `Insufficient coins. Required: ${cost}, Available: ${currentBalance}` });
    }

    // Atomic conditional balance update: prevents negative balance, race conditions & double deductions
    const updateRows = await sql`
      UPDATE users 
      SET coin_balance = coin_balance - ${cost}, updated_at = NOW() 
      WHERE id = ${payload.userId} AND coin_balance >= ${cost}
      RETURNING coin_balance`;

    if (!updateRows.length) {
      const freshRows = await sql`SELECT coin_balance FROM users WHERE id=${payload.userId}`;
      const freshBal = freshRows.length ? Number(freshRows[0].coin_balance || 0) : 0;
      return res.status(400).json({ error: `Insufficient coins. Required: ${cost}, Available: ${freshBal}` });
    }

    const updatedBalance = Number(updateRows[0].coin_balance);

    let redeemedCode = '';
    if (costRows.length > 0) {
      const codeRows = await sql`
        UPDATE rewards 
        SET stock=0, active=false 
        WHERE id=(
          SELECT id FROM rewards 
          WHERE brand=${brand} AND label=${label} AND active=true AND stock>0 
          ORDER BY created_at ASC LIMIT 1
        ) 
        RETURNING code`;
      if (codeRows.length > 0) {
        redeemedCode = codeRows[0].code;
      }
    }

    // If no physical code was in DB, generate realistic formatted simulation voucher code
    if (!redeemedCode) {
      const prefix = (brand.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 4) || 'PAYM');
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randNum = Math.floor(1000 + Math.random() * 9000);
      redeemedCode = `${prefix}-SIM-${randHex}-${randNum}`;
    }

    // Persist redemption history; revert balance if history insertion fails
    try {
      await sql`INSERT INTO reward_redemptions (user_id,user_email,brand,label,code,coins_spent) VALUES (${payload.userId},${payload.email},${brand},${label},${redeemedCode},${cost})`;
    } catch (insertErr) {
      console.error('Failed to insert redemption record, reverting deduction:', insertErr.message);
      await sql`UPDATE users SET coin_balance = coin_balance + ${cost}, updated_at = NOW() WHERE id=${payload.userId}`;
      return res.status(500).json({ error: 'Failed to record redemption history' });
    }

    return res.status(200).json({
      code: redeemedCode,
      coins_spent: cost,
      coin_balance: updatedBalance,
      brand,
      label,
      is_simulation: !costRows.length
    });
  } catch(err) {
    console.error('[/api/rewards/claim]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
