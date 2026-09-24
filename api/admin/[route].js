import authHandler from '../_admin/auth.js';
import overviewHandler from '../_admin/overview.js';
import usersHandler from '../_admin/users.js';
import transactionsHandler from '../_admin/transactions.js';
import redemptionsHandler from '../_admin/redemptions.js';

export default async function handler(req, res) {
  const route = req.query.route || req.url.split('?')[0].split('/').pop();
  switch (route) {
    case 'auth': return authHandler(req, res);
    case 'overview': return overviewHandler(req, res);
    case 'users': return usersHandler(req, res);
    case 'transactions': return transactionsHandler(req, res);
    case 'redemptions': return redemptionsHandler(req, res);
    default: return res.status(404).json({ error: 'Not found: ' + route });
  }
}
