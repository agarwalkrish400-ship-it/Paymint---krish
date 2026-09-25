import { neon } from '@neondatabase/serverless';
let _sql = null;
export function getDb() {
  if (!_sql) {
    const url = process.env.DATABASE_URL
      || process.env.STORAGE_DATABASE_URL
      || process.env.STORAGE_POSTGRES_URL
      || process.env.STORAGE_URL
      || process.env.POSTGRES_URL
      || process.env.neon_purple_ribbon_DATABASE_URL
      || process.env.neon_purple_ribbon_POSTGRES_URL
      || Object.entries(process.env).find(([k, v]) => (k.includes('DATABASE_URL') || k.includes('POSTGRES_URL') || k.endsWith('_URL')) && typeof v === 'string' && (v.startsWith('postgres://') || v.startsWith('postgresql://')))?.[1];
    if (!url) throw new Error('DATABASE_URL not set');
    _sql = neon(url);
  }
  return _sql;
}
