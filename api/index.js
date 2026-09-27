import { setCorsHeaders } from './_auth.js';

import adminAuth from './_routes/admin_auth.js';
import adminOverview from './_routes/admin_overview.js';
import adminRedemptions from './_routes/admin_redemptions.js';
import adminTelemetry from './_routes/admin_telemetry.js';
import adminTransactions from './_routes/admin_transactions.js';
import adminUsers from './_routes/admin_users.js';

import rewardsIndex from './_routes/rewards_index.js';
import rewardsClaim from './_routes/rewards_claim.js';
import rewardsManage from './_routes/rewards_manage.js';

import usersRegister from './_routes/users_register.js';
import usersLogin from './_routes/users_login.js';
import usersMe from './_routes/users_me.js';

import transactionsIndex from './_routes/transactions_index.js';
import transactionsNote from './_routes/transactions_note.js';

import telemetryLog from './_routes/telemetry_log.js';
import ocrHandler from './_routes/ocr.js';
import uploadHandler from './_routes/upload.js';
import leaderboardHandler from './_routes/leaderboard.js';
import schemaHandler from './_routes/schema.js';
import searchAllHandler from './_routes/search_all.js';
import searchExactHandler from './_routes/search_exact.js';

function getPathname(req) {
  let p = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-original-uri'] || req.url || '/';
  if (req.url && req.url.startsWith('/api/') && !req.url.startsWith('/api/index.js')) {
    p = req.url;
  }
  try {
    const u = new URL(p, `http://${req.headers.host || 'localhost'}`);
    return u.pathname.replace(/\/$/, '').toLowerCase();
  } catch (e) {
    return p.split('?')[0].replace(/\/$/, '').toLowerCase();
  }
}

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse body if passed as string/buffer
  if (typeof req.body === 'string' && req.body.length > 0) {
    try { req.body = JSON.parse(req.body); } catch(e){}
  }

  const p = getPathname(req);
  console.log('[API DISPATCH]', req.method, p);

  if (p.endsWith('/admin/auth')) return adminAuth(req, res);
  if (p.endsWith('/admin/overview')) return adminOverview(req, res);
  if (p.endsWith('/admin/redemptions')) return adminRedemptions(req, res);
  if (p.endsWith('/admin/telemetry')) return adminTelemetry(req, res);
  if (p.endsWith('/admin/transactions')) return adminTransactions(req, res);
  if (p.endsWith('/admin/users')) return adminUsers(req, res);

  if (p.endsWith('/rewards/claim')) return rewardsClaim(req, res);
  if (p.endsWith('/rewards/manage')) return rewardsManage(req, res);
  if (p.endsWith('/rewards') || p.endsWith('/rewards/index')) return rewardsIndex(req, res);

  if (p.endsWith('/users/register')) return usersRegister(req, res);
  if (p.endsWith('/users/login')) return usersLogin(req, res);
  if (p.endsWith('/users/me')) return usersMe(req, res);

  if (p.endsWith('/transactions/note')) return transactionsNote(req, res);
  if (p.endsWith('/transactions') || p.endsWith('/transactions/index')) return transactionsIndex(req, res);

  if (p.endsWith('/telemetry/log') || p.endsWith('/telemetry')) return telemetryLog(req, res);
  if (p.endsWith('/ocr')) return ocrHandler(req, res);
  if (p.endsWith('/upload')) return uploadHandler(req, res);
  if (p.endsWith('/leaderboard')) return leaderboardHandler(req, res);
  if (p.endsWith('/schema')) return schemaHandler(req, res);
  if (p.endsWith('/search_all')) return searchAllHandler(req, res);
  if (p.endsWith('/search_exact')) return searchExactHandler(req, res);

  return res.status(404).json({ error: `Not found: ${p}` });
}
