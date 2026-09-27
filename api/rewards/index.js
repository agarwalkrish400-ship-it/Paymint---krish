import { getDb } from '../_db.js';
import { authUser, isFounder, setCorsHeaders } from '../_auth.js';
export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const sql = getDb();
  if (req.method === 'GET') {
    const founder = isFounder(req);
    const user = authUser(req);
    if (!founder && !user) return res.status(401).json({ error: 'Unauthorised' });
      const DEFAULT_CATALOG = [
        { brand: 'Amazon', label: '₹50 Gift Card', cost_coins: 50, codes: ['AMZN-50-A1B2', 'AMZN-50-C3D4', 'AMZN-50-E5F6', 'AMZN-50-G7H8', 'AMZN-50-I9J0'] },
        { brand: 'Amazon', label: '₹100 Gift Card', cost_coins: 100, codes: ['AMZN-100-K1L2', 'AMZN-100-M3N4', 'AMZN-100-O5P6'] },
        { brand: 'Flipkart', label: '₹50 Voucher', cost_coins: 50, codes: ['FK-50-Q1R2', 'FK-50-S3T4', 'FK-50-U5V6', 'FK-50-W7X8'] },
        { brand: 'Swiggy', label: '₹50 Food Voucher', cost_coins: 30, codes: ['SWIG-50-Y1Z2', 'SWIG-50-A3B4', 'SWIG-50-C5D6', 'SWIG-50-E7F8'] },
        { brand: 'Zomato', label: '₹75 Meal Pass', cost_coins: 45, codes: ['ZOM-75-G1H2', 'ZOM-75-I3J4', 'ZOM-75-K5L6'] },
        { brand: 'Starbucks', label: '₹100 Beverage Pass', cost_coins: 80, codes: ['SBUX-100-M1N2', 'SBUX-100-O3P4'] },
        { brand: 'BookMyShow', label: '₹100 Movie Voucher', cost_coins: 70, codes: ['BMS-100-Q1R2', 'BMS-100-S3T4'] },
        { brand: 'Uber', label: '₹50 Premier Ride Pass', cost_coins: 40, codes: ['UBER-50-U1V2', 'UBER-50-W3X4'] },
        { brand: 'Myntra', label: '₹150 Shopping Coupon', cost_coins: 90, codes: ['MYN-150-Y1Z2', 'MYN-150-A3B4'] }
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
