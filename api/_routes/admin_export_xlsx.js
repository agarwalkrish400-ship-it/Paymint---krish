import { getDb } from '../_db.js';
import { isFounder, setCorsHeaders } from '../_auth.js';
import XLSX from 'xlsx';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isFounder(req)) return res.status(403).json({ error: 'Forbidden' });

  const sql = getDb();
  try {
    // 1. Fetch all users
    const userRows = await sql`SELECT * FROM users ORDER BY joined_at DESC LIMIT 1000`;

    // 2. Fetch all transactions
    const txnRows = await sql`
      SELECT t.*, u.name AS u_name, u.age AS u_age, u.occupation AS u_occ 
      FROM transactions t 
      LEFT JOIN users u ON u.id = t.user_id 
      ORDER BY t.created_at DESC LIMIT 2000
    `;

    // 3. Compute per-user spend & top merchant
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

    // 4. Build Sheet 1: Login Data
    const sheet1Headers = ["Name", "Age", "Occupation", "Mail ID", "Total Spend (INR)", "Top Spent Area", "Total Transactions", "Coins Balance", "Joined Date"];
    const sheet1Rows = userRows.map(u => {
      const email = (u.email || '').toLowerCase();
      const totalSpend = spendByUser[email] || 0;
      const mCounts = merchantByUser[email] || {};
      let topMerchant = 'None';
      let maxM = 0;
      for (const [m, amt] of Object.entries(mCounts)) {
        if (amt > maxM) { maxM = amt; topMerchant = m; }
      }
      const userTxnCount = txnRows.filter(t => (t.user_email || '').toLowerCase() === email).length;
      return [
        u.name || "Anonymous",
        u.age || "N/A",
        u.occupation || "N/A",
        u.email || "",
        Number(totalSpend.toFixed(2)),
        topMerchant,
        userTxnCount,
        Number(Number(u.coin_balance || 0).toFixed(1)),
        u.joined_at ? new Date(u.joined_at).toLocaleDateString('en-IN') : "N/A"
      ];
    });

    // 5. Build Sheet 2: Transactional Data
    const sheet2Headers = ["Date Uploaded", "Time", "Payer Name", "Payee Name", "Transaction ID", "Transaction Amount (INR)", "Coins Earned", "Extra Coins Earned", "Details Provided", "Platform Used", "Bank Name", "Screenshot Link"];
    const sheet2Rows = txnRows.map(t => {
      let ssText = "No Screenshot";
      if (t.screenshot_url && t.screenshot_url.startsWith("http")) {
        ssText = t.screenshot_url;
      } else if (t.screenshot_url && t.screenshot_url.startsWith("data:image")) {
        ssText = `https://paymint-krish2.vercel.app/api/admin/screenshot?id=${t.id}&founderPw=BK11`;
      }
      return [
        t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : (t.txn_date || ""),
        t.created_at ? new Date(t.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : (t.txn_time || ""),
        t.user_name || t.u_name || "Unknown",
        t.merchant || "",
        t.txn_id || "N/A",
        Number(Number(t.amount || 0).toFixed(2)),
        Number(Number(t.base_coins || t.coins || 0).toFixed(1)),
        Number(Number(t.bonus_coins || 0).toFixed(1)),
        t.purchase_note || "None",
        t.payment_app || "UPI",
        t.bank || "UPI Bank",
        ssText
      ];
    });

    // 6. Generate real .xlsx file
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([sheet1Headers, ...sheet1Rows]);
    const ws2 = XLSX.utils.aoa_to_sheet([sheet2Headers, ...sheet2Rows]);

    const setColWidths = (ws, data) => {
      if (!data || !data.length) return;
      const colWidths = data[0].map((_, colIdx) => {
        let maxLen = 10;
        for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
          const val = data[rowIdx][colIdx];
          if (val !== null && val !== undefined) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        }
        return { wch: Math.min(maxLen + 3, 50) };
      });
      ws['!cols'] = colWidths;
    };

    setColWidths(ws1, [sheet1Headers, ...sheet1Rows]);
    setColWidths(ws2, [sheet2Headers, ...sheet2Rows]);

    XLSX.utils.book_append_sheet(wb, ws1, "Login Data");
    XLSX.utils.book_append_sheet(wb, ws2, "Transactional Data");

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    const fileName = `Paymint_Master_Data_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buf.length);
    return res.status(200).send(buf);
  } catch (err) {
    console.error('[/api/admin/export-xlsx]', err.message);
    return res.status(500).json({ error: 'Failed to generate Excel workbook' });
  }
}
