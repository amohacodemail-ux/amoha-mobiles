const { Client } = require('pg');
require('dotenv').config();

function buildCandidates() {
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) return [];

  return [
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  ];
}

async function reload() {
  const candidates = buildCandidates();
  
  for (const cs of candidates) {
    const hostMatch = cs.match(/@([^:/]+)/);
    const host = hostMatch ? hostMatch[1] : 'unknown';
    const client = new Client({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });

    try {
      await client.connect();
      console.log(`Connected via ${host}`);
      await client.query(`NOTIFY pgrst, 'reload schema'`);
      console.log(`Schema reloaded via ${host}!`);
      await client.end();
      return;
    } catch (err) {
      console.error(`Failed ${host}:`, err.message);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }
}

reload();
