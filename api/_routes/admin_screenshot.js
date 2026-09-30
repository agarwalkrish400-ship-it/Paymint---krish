import { getDb } from '../_db.js';
import { isFounder, setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isFounder(req)) return res.status(403).json({ error: 'Forbidden' });

  // Get transaction id from query or body
  let id = null;
  let download = false;
  try {
    const u = new URL(req.url, 'http://localhost');
    id = u.searchParams.get('id') || u.searchParams.get('txId');
    download = u.searchParams.get('download') === '1' || u.searchParams.get('dl') === '1';
  } catch(e) {}

  if (!id && req.query) {
    id = req.query.id || req.query.txId;
    download = download || req.query.download === '1';
  }
  if (!id && req.body) {
    id = req.body.id || req.body.txId;
  }

  if (!id) {
    return res.status(400).json({ error: 'Transaction id required' });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT id, merchant, amount, screenshot_url, txn_id, created_at 
      FROM transactions 
      WHERE id = ${id} 
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = rows[0];
    const ssUrl = tx.screenshot_url;

    if (!ssUrl) {
      return res.status(404).send('No screenshot recorded for this transaction.');
    }

    const trimmed = String(ssUrl).trim();

    // If it's a remote URL
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return res.redirect(302, trimmed);
    }

    const safeMerchant = (tx.merchant || 'txn').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Paymint_${safeMerchant}_${tx.txn_id || tx.id}.jpg`;

    // If it's a base64 data URI
    if (trimmed.startsWith('data:')) {
      const commaIdx = trimmed.indexOf(',');
      if (commaIdx === -1) {
        return res.status(400).send('Invalid screenshot data URI.');
      }
      const meta = trimmed.slice(0, commaIdx);
      const mimeMatch = meta.match(/data:([^;]+)/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const base64Data = trimmed.slice(commaIdx + 1);
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.setHeader(
        'Content-Disposition',
        download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`
      );
      return res.status(200).send(buffer);
    }

    // If raw base64 string
    try {
      const buffer = Buffer.from(trimmed, 'base64');
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      res.setHeader(
        'Content-Disposition',
        download ? `attachment; filename="${filename}"` : `inline; filename="${filename}"`
      );
      return res.status(200).send(buffer);
    } catch (e) {
      return res.status(400).send('Unsupported screenshot format.');
    }
  } catch(err) {
    console.error('[/api/admin/screenshot]', err.message);
    return res.status(500).json({ error: 'Failed to retrieve screenshot' });
  }
}
