import { getDb } from '../_db.js';
import { isFounder, setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isFounder(req)) return res.status(403).json({ error: 'Forbidden' });

  const sql = getDb();
  try {
    // 1. Fetch all users
    const userRows = await sql`SELECT * FROM users ORDER BY joined_at DESC LIMIT 500`;

    // 2. Fetch all transactions with user names
    const txnRows = await sql`
      SELECT t.*, u.name AS u_name, u.age AS u_age, u.occupation AS u_occ 
      FROM transactions t 
      LEFT JOIN users u ON u.id = t.user_id 
      ORDER BY t.created_at DESC LIMIT 1000
    `;

    // 3. Compute per-user spend & top spent area
    const spendByUser = {};
    const merchantByUser = {};

    for (const t of txnRows) {
      const email = (t.user_email || '').toLowerCase();
      const amt = Number(t.amount || 0);
      spendByUser[email] = (spendByUser[email] || 0) + amt;

      if (!merchantByUser[email]) merchantByUser[email] = {};
      const m = (t.merchant || 'Unknown').trim();
      merchantByUser[email][m] = (merchantByUser[email][m] || 0) + amt;
    }

    const loginData = userRows.map(u => {
      const email = (u.email || '').toLowerCase();
      const totalSpend = spendByUser[email] || 0;
      const mCounts = merchantByUser[email] || {};
      let topMerchant = 'None';
      let maxM = 0;
      for (const [m, amt] of Object.entries(mCounts)) {
        if (amt > maxM) {
          maxM = amt;
          topMerchant = m;
        }
      }

      return {
        id: u.id,
        name: u.name || 'Anonymous',
        age: u.age || 'N/A',
        occupation: u.occupation || 'N/A',
        email: u.email,
        total_spend: totalSpend,
        top_spent_area: topMerchant,
        coins_balance: Number(u.coin_balance || 0),
        joined_at: u.joined_at
      };
    });

    const transactionalData = txnRows.map(t => ({
      id: t.id,
      date_uploaded: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '',
      time_uploaded: t.created_at ? new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
      payer_name: t.user_name || t.u_name || 'Unknown',
      payer_email: t.user_email || '',
      payee_name: t.merchant || '',
      transaction_id: t.txn_id || 'N/A',
      transaction_amount: Number(t.amount || 0),
      coins_earned: Number(t.base_coins || t.coins || 0),
      extra_coins_earned: Number(t.bonus_coins || 0),
      details_provided: t.purchase_note || 'None',
      platform_used: t.payment_app || 'UPI',
      bank_name: t.bank || 'UPI Bank',
      screenshot_url: t.screenshot_url || '',
      created_at: t.created_at
    }));

    // If client requested a direct webhook push to Google Sheets:
    const targetWebhook = req.body?.webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;
    let syncResult = null;

    if (req.method === 'POST' && targetWebhook) {
      try {
        const resp = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            founder_email: 'agarwalkrish400@gmail.com',
            timestamp: new Date().toISOString(),
            login_data: loginData,
            transactional_data: transactionalData
          })
        });
        const text = await resp.text();
        syncResult = { ok: resp.ok, status: resp.status, response: text };
      } catch (e) {
        syncResult = { ok: false, error: e.message };
      }
    }

    return res.status(200).json({
      ok: true,
      login_data: loginData,
      transactional_data: transactionalData,
      sync_result: syncResult
    });
  } catch (err) {
    console.error('[/api/admin/export]', err.message);
    return res.status(500).json({ error: 'Failed to generate export data' });
  }
}
