import { getDb } from '../_db.js';
import { isFounder, setCorsHeaders } from '../_auth.js';
export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isFounder(req)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method !== 'GET' && req.method !== 'PATCH' && req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  if (req.method === 'DELETE') {
    const { transactionId, txId } = req.body || {};
    const targetId = transactionId || txId;
    if (!targetId) return res.status(400).json({ error: 'transactionId required' });
    const sql = getDb();
    try {
      const txRows = await sql`SELECT * FROM transactions WHERE id=${targetId} LIMIT 1`;
      if (!txRows.length) return res.status(404).json({ error: 'Transaction not found' });
      const tx = txRows[0];
      const deductCoins = Number(tx.total_coins || tx.base_coins || (Number(tx.amount || 0) * 0.10) || 0);
      const deductBase = Number(tx.base_coins || (Number(tx.amount || 0) * 0.10) || 0);
      const deductBonus = Number(tx.bonus_coins || 0);

      await sql`DELETE FROM transactions WHERE id=${targetId}`;
      if (tx.user_id) {
        await sql`UPDATE users SET 
          coin_balance = GREATEST(0, coin_balance - ${deductCoins}),
          base_coins = GREATEST(0, base_coins - ${deductBase}),
          bonus_coins = GREATEST(0, bonus_coins - ${deductBonus}),
          updated_at = NOW()
          WHERE id=${tx.user_id}`;
      }
      return res.status(200).json({ ok: true, deletedId: targetId });
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }
  if (req.method === 'PATCH') {
    const { txId, action } = req.body || {};
    if (!txId) return res.status(400).json({ error: 'txId required' });
    const sql = getDb();
    if (action === 'approve') {
      const tx = await sql`SELECT * FROM transactions WHERE id=${txId} LIMIT 1`;
      if (!tx.length) return res.status(404).json({ error: 'Transaction not found' });
      await sql`UPDATE transactions SET verified=true WHERE id=${txId}`;
      await sql`UPDATE users SET coin_balance=coin_balance+${Number(tx[0].total_coins||0)} WHERE id=${tx[0].user_id}`;
      return res.status(200).json({ ok: true, message: 'Transaction approved and coins credited.' });
    }
    if (action === 'reject') {
      await sql`UPDATE transactions SET verified=false WHERE id=${txId}`;
      return res.status(200).json({ ok: true, message: 'Transaction marked rejected.' });
    }
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT t.*,u.name AS user_name,u.occupation AS user_occupation
      FROM transactions t JOIN users u ON u.id=t.user_id
      ORDER BY t.created_at DESC LIMIT 500`;
    return res.status(200).json(rows.map(t=>({
      id:t.id, user_name:t.user_name, user_email:t.user_email,
      user_occupation:t.user_occupation, merchant:t.merchant,
      amount:Number(t.amount), base_coins:Number(t.base_coins),
      bonus_coins:Number(t.bonus_coins), total_coins:Number(t.total_coins),
      txn_id:t.txn_id, txn_date:t.txn_date, txn_time:t.txn_time,
      payment_app:t.payment_app, bank:t.bank, screenshot_url:t.screenshot_url,
      purchase_note:t.purchase_note, bonus_claimed:t.bonus_claimed, verified:t.verified!==false, created_at:t.created_at,
    })));
  } catch(err) {
    console.error('[/api/admin/transactions]', err.message);
    return res.status(500).json({ error: 'Failed to load transactions' });
  }
}
