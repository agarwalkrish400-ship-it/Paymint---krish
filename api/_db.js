import { neon } from '@neondatabase/serverless';
let _sql = null;

export function getDb() {
  if (!_sql) {
    // Check all common Vercel and Neon postgres environment variable keys
    let url = process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.STORAGE_POSTGRES_URL ||
      process.env.STORAGE_DATABASE_URL ||
      process.env.NEON_DATABASE_URL;

    // Fallback: search any env var containing POSTGRES or DATABASE_URL starting with postgres:// or postgresql://
    if (!url) {
      const matchKey = Object.keys(process.env).find(k => 
        (k.toUpperCase().includes('DATABASE_URL') || k.toUpperCase().includes('POSTGRES_URL') || k.toUpperCase().includes('POSTGRES')) &&
        typeof process.env[k] === 'string' &&
        (process.env[k].startsWith('postgres://') || process.env[k].startsWith('postgresql://'))
      );
      if (matchKey) url = process.env[matchKey];
    }

    if (!url) {
      throw new Error('DATABASE_URL / POSTGRES_URL not configured in Vercel Environment Variables');
    }
    _sql = neon(url);
  }
  return _sql;
}
