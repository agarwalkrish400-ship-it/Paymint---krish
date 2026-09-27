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

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extract clean path from req.url
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  let pathname = url.pathname.replace(/\/$/, '').toLowerCase();

  // Route matching
  if (pathname === '/api/admin/auth') return adminAuth(req, res);
  if (pathname === '/api/admin/overview') return adminOverview(req, res);
  if (pathname === '/api/admin/redemptions') return adminRedemptions(req, res);
  if (pathname === '/api/admin/telemetry') return adminTelemetry(req, res);
  if (pathname === '/api/admin/transactions') return adminTransactions(req, res);
  if (pathname === '/api/admin/users') return adminUsers(req, res);

  if (pathname === '/api/rewards/claim') return rewardsClaim(req, res);
  if (pathname === '/api/rewards/manage') return rewardsManage(req, res);
  if (pathname === '/api/rewards') return rewardsIndex(req, res);

  if (pathname === '/api/users/register') return usersRegister(req, res);
  if (pathname === '/api/users/login') return usersLogin(req, res);
  if (pathname === '/api/users/me') return usersMe(req, res);

  if (pathname === '/api/transactions/note') return transactionsNote(req, res);
  if (pathname === '/api/transactions') return transactionsIndex(req, res);

  if (pathname === '/api/telemetry/log' || pathname === '/api/telemetry') return telemetryLog(req, res);
  if (pathname === '/api/ocr') return ocrHandler(req, res);
  if (pathname === '/api/upload') return uploadHandler(req, res);
  if (pathname === '/api/leaderboard') return leaderboardHandler(req, res);
  if (pathname === '/api/schema') return schemaHandler(req, res);
  if (pathname === '/api/search_all') return searchAllHandler(req, res);
  if (pathname === '/api/search_exact') return searchExactHandler(req, res);

  return res.status(404).json({ error: `Not found: ${pathname}` });
}
