import { getDb } from '../_db.js';
import { setCorsHeaders, authUser } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = getDb();
  const user = authUser(req);

  if (req.method === 'POST') {
    try {
      const {
        payment_app = 'Unknown',
        amount = null,
        merchant = null,
        raw_title = '',
        raw_text = '',
        status = 'detected',
        user_email: payloadEmail,
        user_name: payloadName
      } = req.body || {};

      const finalEmail = user?.email || payloadEmail || 'anonymous-beta@paymint.app';
      const finalName = user?.name || payloadName || 'Beta User';
      const finalUserId = user?.id || null;

      const numAmount = amount ? parseFloat(amount) : null;

      const [row] = await sql`
        INSERT INTO beta_payment_detections 
          (user_id, user_email, user_name, payment_app, amount, merchant, raw_title, raw_text, status)
        VALUES 
          (${finalUserId}, ${finalEmail}, ${finalName}, ${payment_app}, ${numAmount}, ${merchant}, ${raw_title}, ${raw_text}, ${status})
        RETURNING *
      `;

      return res.status(200).json({ ok: true, data: row });
    } catch (err) {
      console.error('Telemetry log error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { id, status } = req.body || {};
      if (!id || !status) return res.status(400).json({ error: 'id and status required' });

      const [row] = await sql`
        UPDATE beta_payment_detections
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      return res.status(200).json({ ok: true, data: row });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
