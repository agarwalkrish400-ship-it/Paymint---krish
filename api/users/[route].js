import meHandler from '../_users/me.js';
import registerHandler from '../_users/register.js';

export default async function handler(req, res) {
  const route = req.query.route || req.url.split('?')[0].split('/').pop();
  switch (route) {
    case 'me': return meHandler(req, res);
    case 'register': return registerHandler(req, res);
    default: return res.status(404).json({ error: 'Not found: ' + route });
  }
}
