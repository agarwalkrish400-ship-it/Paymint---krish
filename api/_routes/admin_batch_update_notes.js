import { getDb } from '../_db.js';
import { isFounder, setCorsHeaders } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isFounder(req)) return res.status(403).json({ error: 'Forbidden' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { updates } = req.body || {};
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Array of updates required' });
  }

  const sql = getDb();
  const auditResults = [];

  try {
    for (const item of updates) {
      const { id, purchase_note } = item || {};
      if (!id || !purchase_note || !purchase_note.trim()) {
        auditResults.push({ id, status: 'skipped', reason: 'Missing id or purchase_note' });
        continue;
      }

      // Execute parameterized conditional SQL update using primary key (UUID)
      // Ensures purchase_note is updated ONLY IF it is still missing (NULL, empty, or 'None')
      const updatedRows = await sql`
        UPDATE transactions 
        SET purchase_note = ${purchase_note.trim()}
        WHERE id = ${id} 
        AND (purchase_note IS NULL OR purchase_note = '' OR purchase_note = 'None')
        RETURNING id, purchase_note, user_email, merchant, amount
      `;

      if (updatedRows && updatedRows.length > 0) {
        auditResults.push({
          id,
          status: 'updated',
          new_value: updatedRows[0].purchase_note,
          merchant: updatedRows[0].merchant,
          amount: Number(updatedRows[0].amount)
        });
      } else {
        auditResults.push({
          id,
          status: 'not_updated',
          reason: 'Record not found or purchase_note was already populated'
        });
      }
    }

    const updatedCount = auditResults.filter(r => r.status === 'updated').length;

    return res.status(200).json({
      ok: true,
      total_requested: updates.length,
      updated_count: updatedCount,
      skipped_count: updates.length - updatedCount,
      results: auditResults
    });
  } catch (err) {
    console.error('[/api/admin/batch-update-notes]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
