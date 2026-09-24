import { neon } from '@neondatabase/serverless';
let _sql = null;
export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
      || process.env.neon_purple_ribbon_DATABASE_URL
      || process.env.neon_purple_ribbon_POSTGRES_URL
      || process.env.POSTGRES_URL;
    if (!url) throw new Error('DATABASE_URL not set');
    _sql = neon(url);
  }
  return _sql;
}
