import { getDb } from '../_db.js';
import { authUser, isFounder, setCorsHeaders } from '../_auth.js';
export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const sql = getDb();
  if (req.method === 'GET') {
    const founder = isFounder(req);
    const user = authUser(req);
    // Catalog is public for browsing simulation rewards; founder gets extended stock view
    try {
      const DEFAULT_CATALOG = [
        { brand: 'Netflix', label: '1-Month Mobile Subscription', cost_coins: 1490, codes: ['NFLX-SIM-M101', 'NFLX-SIM-M102', 'NFLX-SIM-M103', 'NFLX-SIM-M104'] },
        { brand: 'Netflix', label: '1-Month Basic HD Plan', cost_coins: 1990, codes: ['NFLX-SIM-B201', 'NFLX-SIM-B202', 'NFLX-SIM-B203'] },
        { brand: 'Spotify', label: '1-Month Premium Individual', cost_coins: 1190, codes: ['SPOT-SIM-P101', 'SPOT-SIM-P102', 'SPOT-SIM-P103', 'SPOT-SIM-P104'] },
        { brand: 'Apple Music', label: '1-Month Individual Plan', cost_coins: 990, codes: ['APPL-SIM-M101', 'APPL-SIM-M102', 'APPL-SIM-M103'] },
        { brand: 'YouTube Premium', label: '1-Month Ad-Free + YouTube Music', cost_coins: 1490, codes: ['YT-SIM-P101', 'YT-SIM-P102', 'YT-SIM-P103'] },
        { brand: 'Swiggy', label: '1-Month Swiggy One Membership', cost_coins: 990, codes: ['SWIG-SIM-ONE1', 'SWIG-SIM-ONE2', 'SWIG-SIM-ONE3'] },
        { brand: 'Zepto', label: '1-Month Zepto Pass', cost_coins: 990, codes: ['ZEPT-SIM-PASS1', 'ZEPT-SIM-PASS2', 'ZEPT-SIM-PASS3'] },
        { brand: 'Zomato', label: '1-Month Zomato Gold Pass', cost_coins: 990, codes: ['ZOM-SIM-GOLD1', 'ZOM-SIM-GOLD2', 'ZOM-SIM-GOLD3'] },
        { brand: 'Amazon', label: '₹250 Amazon Pay Gift Card', cost_coins: 2500, codes: ['AMZN-SIM-250A', 'AMZN-SIM-250B', 'AMZN-SIM-250C', 'AMZN-SIM-250D'] },
        { brand: 'Amazon', label: '₹500 Amazon Pay Gift Card', cost_coins: 5000, codes: ['AMZN-SIM-500A', 'AMZN-SIM-500B', 'AMZN-SIM-500C'] },
        { brand: 'Blinkit', label: '₹100 Quick Commerce Voucher', cost_coins: 1000, codes: ['BLNK-SIM-100A', 'BLNK-SIM-100B', 'BLNK-SIM-100C'] },
        { brand: 'Blinkit', label: '₹250 Quick Commerce Voucher', cost_coins: 2500, codes: ['BLNK-SIM-250A', 'BLNK-SIM-250B', 'BLNK-SIM-250C'] },
        { brand: 'Swiggy', label: '₹200 Food Delivery Voucher', cost_coins: 2000, codes: ['SWIG-SIM-200A', 'SWIG-SIM-200B', 'SWIG-SIM-200C'] },
        { brand: 'Zomato', label: '₹200 Dining & Delivery Voucher', cost_coins: 2000, codes: ['ZOM-SIM-200A', 'ZOM-SIM-200B', 'ZOM-SIM-200C'] },
        { brand: 'Myntra', label: '₹300 Fashion Voucher', cost_coins: 3000, codes: ['MYNT-SIM-300A', 'MYNT-SIM-300B', 'MYNT-SIM-300C'] },
        { brand: 'Flipkart', label: '₹250 Shopping Gift Card', cost_coins: 2500, codes: ['FLIP-SIM-250A', 'FLIP-SIM-250B', 'FLIP-SIM-250C'] },
        { brand: 'Uber', label: '₹150 Uber Rides Voucher', cost_coins: 1500, codes: ['UBER-SIM-150A', 'UBER-SIM-150B', 'UBER-SIM-150C'] },
        { brand: 'Starbucks', label: '₹250 Beverage Card', cost_coins: 2500, codes: ['SBUX-SIM-250A', 'SBUX-SIM-250B', 'SBUX-SIM-250C'] },
        { brand: 'Direct Cashback', label: '₹75 Direct UPI Cashback (on ₹5,000 spend)', cost_coins: 750, codes: ['CASH-SIM-75A', 'CASH-SIM-75B', 'CASH-SIM-75C'] },
        { brand: 'Direct Cashback', label: '₹150 Direct UPI Cashback (on ₹10,000 spend)', cost_coins: 1500, codes: ['CASH-SIM-150A', 'CASH-SIM-150B', 'CASH-SIM-150C'] },
        { brand: 'Direct Cashback', label: '₹300 Direct UPI Cashback (on ₹20,000 spend)', cost_coins: 3000, codes: ['CASH-SIM-300A', 'CASH-SIM-300B', 'CASH-SIM-300C'] },
      ];

      let countResult = await sql`SELECT COUNT(*)::int AS cnt FROM rewards WHERE active=true AND stock>0`;
      if (!countResult[0]?.cnt || countResult[0].cnt === 0) {
        // Auto-seed default rewards into database
        for (const item of DEFAULT_CATALOG) {
          for (const code of item.codes) {
            await sql`INSERT INTO rewards (brand, label, cost_coins, code, stock, active)
                      VALUES (${item.brand}, ${item.label}, ${item.cost_coins}, ${code}, 1, true)`;
          }
        }
      }

      if (founder) {
        // Founder gets all individual reward items or grouped overview
        const rows = await sql`
          SELECT id, brand, label, cost_coins, code, stock, active, created_at
          FROM rewards
          ORDER BY created_at DESC, brand, label`;
        return res.status(200).json(rows.map(r=>({
          id: r.id,
          brand: r.brand,
          label: r.label,
          cost_coins: Number(r.cost_coins),
          code: r.code,
          stock: Number(r.stock),
          active: !!r.active,
          created_at: r.created_at
        })));
      }

      const rows = await sql`
        SELECT brand,label,cost_coins,
          COUNT(*) FILTER (WHERE active AND stock>0) AS available
        FROM rewards GROUP BY brand,label,cost_coins
        HAVING COUNT(*) FILTER (WHERE active AND stock>0)>0
        ORDER BY brand,label`;
      
      if (rows.length === 0) {
        return res.status(200).json(DEFAULT_CATALOG.map(r => ({
          brand: r.brand,
          label: r.label,
          cost_coins: r.cost_coins,
          available: r.codes.length
        })));
      }

      return res.status(200).json(rows.map(r=>({
        brand:r.brand, label:r.label,
        cost_coins:Number(r.cost_coins), available:Number(r.available)
      })));
    } catch(err) {
      console.error('[/api/rewards GET]', err.message);
      return res.status(500).json({ error: 'Failed to load rewards' });
    }
  }
  if (req.method === 'POST') {
    if (!isFounder(req)) return res.status(403).json({ error: 'Forbidden' });
    const { brand, label, cost_coins, codes } = req.body || {};
    if (!brand||!label||!cost_coins||!codes?.length)
      return res.status(400).json({ error: 'Missing fields' });
    try {
      await Promise.all(codes.map(code =>
        sql`INSERT INTO rewards (brand,label,cost_coins,code,stock,active)
            VALUES (${brand},${label},${Number(cost_coins)},${code.trim()},1,true)`
      ));
      return res.status(201).json({ inserted: codes.length });
    } catch(err) {
      console.error('[/api/rewards POST]', err.message);
      return res.status(500).json({ error: 'Failed to add reward codes' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
