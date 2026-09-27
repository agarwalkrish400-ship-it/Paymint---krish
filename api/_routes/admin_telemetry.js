import { getDb } from '../_db.js';
import { setCorsHeaders, isFounder } from '../_auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!isFounder(req)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = getDb();

  try {
    // 1. Total counts by status
    const counts = await sql`
      SELECT 
        COUNT(*) as total_detected,
        COUNT(*) FILTER (WHERE status = 'clicked') as total_clicked,
        COUNT(*) FILTER (WHERE status = 'uploaded') as total_uploaded,
        COUNT(*) FILTER (WHERE status = 'dismissed') as total_dismissed
      FROM beta_payment_detections
    `;

    // 2. Breakdown by payment app (GPay, PhonePe, Paytm, etc.)
    const appBreakdown = await sql`
      SELECT payment_app, COUNT(*) as count, SUM(COALESCE(amount, 0)) as total_amount
      FROM beta_payment_detections
      GROUP BY payment_app
      ORDER BY count DESC
    `;

    // 3. Recent 50 detections stream
    const recentDetections = await sql`
      SELECT id, user_email, user_name, payment_app, amount, merchant, raw_title, status, created_at
      FROM beta_payment_detections
      ORDER BY created_at DESC
      LIMIT 100
    `;

    // 4. Active beta user activity
    const activeTesters = await sql`
      SELECT 
        user_email,
        user_name,
        COUNT(*) as detections_count,
        COUNT(*) FILTER (WHERE status = 'uploaded') as uploads_count,
        MAX(created_at) as last_active
      FROM beta_payment_detections
      GROUP BY user_email, user_name
      ORDER BY detections_count DESC
      LIMIT 50
    `;

    return res.status(200).json({
      summary: counts[0] || { total_detected: 0, total_clicked: 0, total_uploaded: 0, total_dismissed: 0 },
      appBreakdown,
      recentDetections,
      activeTesters
    });
  } catch (err) {
    console.error('Admin telemetry error:', err);
    return res.status(500).json({ error: err.message });
  }
}
