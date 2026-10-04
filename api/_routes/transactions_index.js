import { getDb } from '../_db.js';
import { authUser, isFounder, setCorsHeaders } from '../_auth.js';
function fmt(t){return{id:t.id,merchant:t.merchant,amount:Number(t.amount),base_coins:Number(t.base_coins),bonus_coins:Number(t.bonus_coins),total_coins:Number(t.total_coins),coins:Number(t.total_coins),txn_id:t.txn_id,txn_date:t.txn_date,txn_time:t.txn_time,payment_app:t.payment_app,bank:t.bank,screenshot_url:t.screenshot_url,purchase_note:t.purchase_note,bonus_claimed:t.bonus_claimed,verified:t.verified,created_at:t.created_at};}
export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'DELETE') {
    if (!isFounder(req)) return res.status(403).json({ error: 'Forbidden' });
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

      let newBalance = 0;
      if (tx.user_id) {
        const uRows = await sql`SELECT coin_balance,base_coins,bonus_coins FROM users WHERE id=${tx.user_id}`;
        newBalance = Number(uRows[0]?.coin_balance || 0);
      }
      return res.status(200).json({ ok: true, deletedId: targetId, coin_balance: newBalance });
    } catch(err) {
      return res.status(500).json({ error: err.message });
    }
  }
  const payload = authUser(req);
  if (!payload) return res.status(401).json({ error: 'Unauthorised' });
  const sql = getDb();
  if (req.method === 'GET') {
    const rows = await sql`SELECT * FROM transactions WHERE user_id=${payload.userId} ORDER BY created_at DESC LIMIT 100`;
    return res.status(200).json(rows.map(fmt));
  }
  if (req.method === 'POST') {
    const { merchant, amount, txnId, txnDate, txnTime, paymentApp, bank, screenshotUrl } = req.body || {};
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt) || amt <= 0 || amt > 500000) return res.status(400).json({ error: 'Invalid amount: ' + amount });
    if (!merchant?.trim()) return res.status(400).json({ error: 'Merchant name required' });
    // Reject received / incoming payments (coins only earned for payments made to someone)
    const lowerMerchant = (merchant || '').toLowerCase();
    if (
      lowerMerchant.includes('received from') ||
      lowerMerchant.includes('payment received') ||
      lowerMerchant.includes('money received') ||
      lowerMerchant.includes('cashback received') ||
      lowerMerchant.includes('refund received')
    ) {
      return res.status(400).json({
        error: 'received_payment_ineligible',
        message: 'Coins are only credited for payments made to merchants or individuals. Received payments are not eligible for coins.'
      });
    }

    const baseCoins = parseFloat((amt * 0.10).toFixed(1));
    try {
    // 0. Strict 2-hour (120-minute) window check on backend (IST UTC+5:30)
    if (txnDate && typeof txnDate === 'string' && txnDate.trim()) {
      const dStr = txnDate.trim();
      const tStr = (txnTime && typeof txnTime === 'string') ? txnTime.trim() : null;
      const now = new Date();
      const nowIst = new Date(now.getTime() + (5.5 * 3600 * 1000));

      if (tStr) {
        let txDateObj = new Date(`${dStr}T${tStr}:00+05:30`);
        if (!isNaN(txDateObj.getTime())) {
          let diffMin = (now.getTime() - txDateObj.getTime()) / (60 * 1000);
          // AM/PM ambiguity correction (12-hour shift)
          if (diffMin > 600 && diffMin < 840) {
            const altDateObj = new Date(txDateObj.getTime() + 12 * 60 * 60 * 1000);
            const altDiff = (now.getTime() - altDateObj.getTime()) / (60 * 1000);
            if (Math.abs(altDiff) <= 120) diffMin = altDiff;
          }
          if (diffMin < 0 && diffMin >= -15) diffMin = 0; // tolerance for slight clock drift
          if (diffMin > 120) {
            return res.status(400).json({
              error: 'upload_window_expired',
              message: `This transaction occurred ${Math.round(diffMin)} minutes ago. Screenshots must be uploaded within 2 hours of payment.`
            });
          }
        }
      } else {
        const todayIst = nowIst.toISOString().split('T')[0];
        const diffDays = (new Date(todayIst) - new Date(dStr)) / (24 * 3600 * 1000);
        if (diffDays >= 2 || (diffDays === 1 && nowIst.getUTCHours() >= 2)) {
          return res.status(400).json({
            error: 'upload_window_expired',
            message: 'This transaction date is older than 2 hours. Screenshots must be uploaded within 2 hours of payment.'
          });
        }
      }
    }

            // 0b. NPCI UTR Julian Day & Year Validation
      if (txnId && typeof txnId === 'string') {
        const isBhim = paymentApp && /bhim/i.test(paymentApp);
        const cleanUtr = txnId.trim().replace(/\s+/g, '');
        if (!isBhim && /^\d{12}$/.test(cleanUtr)) {
          const utrYearDigit = parseInt(cleanUtr[0]);
          const utrJulianDay = parseInt(cleanUtr.slice(1, 4));

          // If day code is outside 1-366, it is an app-specific transaction ID rather than an NPCI Julian UTR
          if (!isNaN(utrJulianDay) && utrJulianDay >= 1 && utrJulianDay <= 366) {
            let targetDate = new Date();
            if (txnDate && typeof txnDate === 'string' && txnDate.trim()) {
              const p = new Date(txnDate.trim());
              if (!isNaN(p.getTime())) targetDate = p;
            }

            const startOfYear = new Date(targetDate.getFullYear(), 0, 0);
            const diffMs = (targetDate - startOfYear) + ((startOfYear.getTimezoneOffset() - targetDate.getTimezoneOffset()) * 60 * 1000);
            const expectedJulianDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const expectedYearDigit = targetDate.getFullYear() % 10;

            const yearDiff = Math.abs(utrYearDigit - expectedYearDigit);
            const dayDiff = Math.abs(utrJulianDay - expectedJulianDay);

            if (yearDiff !== 0 && !(yearDiff === 1 && (expectedJulianDay <= 2 || expectedJulianDay >= 364))) {
              return res.status(400).json({
                error: 'invalid_utr_reference',
                message: 'Invalid UPI Reference ID (UTR). The reference number does not match the payment receipt year.'
              });
            }

            if (dayDiff > 2 && dayDiff < 363) {
              return res.status(400).json({
                error: 'invalid_utr_reference',
                message: 'Invalid UPI Reference ID (UTR). The reference number date code contradicts the payment date.'
              });
            }
          }
        }
      }

      // 1. Global duplicate check: UPI UTR / Transaction Ref ID cannot be reused by anyone
      if (txnId?.trim()) {
        const dup = await sql`SELECT id FROM transactions WHERE txn_id=${txnId.trim()} LIMIT 1`;
        if (dup.length > 0) {
          return res.status(409).json({ error: 'duplicate_transaction', message: 'This transaction (UTR / Ref ID) was already submitted.' });
        }
      }

      // 2. Duplicate screenshot check: exact same screenshot cannot be submitted twice
      if (screenshotUrl && typeof screenshotUrl === 'string' && screenshotUrl.length > 50) {
        const dupSs = await sql`SELECT id FROM transactions WHERE screenshot_url=${screenshotUrl} LIMIT 1`;
        if (dupSs.length > 0) {
          return res.status(409).json({ error: 'duplicate_transaction', message: 'This screenshot has already been submitted.' });
        }
      }

      // 3. Exact receipt match across ANY user: same merchant, amount, date & time
      const trimmedMerchant = merchant.trim();
      if (txnDate && typeof txnDate === 'string' && txnDate.trim() && txnTime && typeof txnTime === 'string' && txnTime.trim()) {
        const dupReceipt = await sql`SELECT id FROM transactions WHERE amount=${amt} AND LOWER(TRIM(merchant))=LOWER(${trimmedMerchant}) AND txn_date=${txnDate.trim()} AND txn_time=${txnTime.trim()} LIMIT 1`;
        if (dupReceipt.length > 0) {
          return res.status(409).json({ error: 'duplicate_transaction', message: 'This payment receipt was already submitted.' });
        }
      }

      // 4. User duplicate check: same merchant and amount within same date or last 24 hours
      let dupUser = [];
      if (txnDate && typeof txnDate === 'string' && txnDate.trim()) {
        dupUser = await sql`SELECT id FROM transactions WHERE user_id=${payload.userId} AND amount=${amt} AND LOWER(TRIM(merchant))=LOWER(${trimmedMerchant}) AND (txn_date=${txnDate.trim()} OR created_at > NOW() - INTERVAL '24 hours') LIMIT 1`;
      } else {
        dupUser = await sql`SELECT id FROM transactions WHERE user_id=${payload.userId} AND amount=${amt} AND LOWER(TRIM(merchant))=LOWER(${trimmedMerchant}) AND created_at > NOW() - INTERVAL '24 hours' LIMIT 1`;
      }
      if (dupUser.length > 0) {
        return res.status(409).json({ error: 'duplicate_transaction', message: 'You have already submitted a transaction for this merchant and amount.' });
      }

      const txRows = await sql`INSERT INTO transactions (user_id,user_email,user_name,merchant,amount,base_coins,bonus_coins,total_coins,txn_id,txn_date,txn_time,payment_app,bank,screenshot_url) VALUES (${payload.userId},${payload.email},${payload.name||''},${merchant.trim()},${amt},${baseCoins},0,${baseCoins},${txnId?.trim()||null},${txnDate||null},${txnTime||null},${paymentApp||null},${bank||null},${screenshotUrl||null}) RETURNING *`;
      await sql`UPDATE users SET coin_balance=coin_balance+${baseCoins},base_coins=base_coins+${baseCoins},updated_at=NOW() WHERE id=${payload.userId}`;
      const uRows = await sql`SELECT coin_balance,base_coins,bonus_coins FROM users WHERE id=${payload.userId}`;
      return res.status(201).json({ transaction:fmt(txRows[0]), coin_balance:Number(uRows[0].coin_balance), base_coins:Number(uRows[0].base_coins), bonus_coins:Number(uRows[0].bonus_coins), coins_earned:baseCoins });
    } catch(err) {
      if (err.code==='23505') return res.status(409).json({ error:'duplicate_transaction', message:'Transaction reference already used.' });
      return res.status(500).json({ error: err.message });
    }
  }


  return res.status(405).json({ error: 'Method not allowed' });
}
