import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Geo-Tag: store the exact assigned territory reference used at capture time
-- (so each saved location keeps the centre + radius even if the fence changes later).
ALTER TABLE geo_tags ADD COLUMN IF NOT EXISTS fence_center_lat NUMERIC(10,8);
ALTER TABLE geo_tags ADD COLUMN IF NOT EXISTS fence_center_lng NUMERIC(11,8);
ALTER TABLE geo_tags ADD COLUMN IF NOT EXISTS fence_radius_meters INTEGER;

-- Refresh PostgREST schema cache so the API sees the new columns immediately
NOTIFY pgrst, 'reload schema';
`;

const REQUIRED_COLUMNS = ['fence_center_lat', 'fence_center_lng', 'fence_radius_meters'];

/** Build candidate pg connection strings from env vars (same pattern as v14). */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) {
    logger.warn('[migration-v15] SUPABASE_DB_PASSWORD not set — skipping auto-apply. Run backend/supabase-migration-geo-tag.sql in Supabase SQL Editor.');
    return [];
  }

  return [
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  ];
}

export async function runV15Migration(): Promise<void> {
  // 1. Try to auto-apply when direct DB credentials are available
  const candidates = buildCandidates();
  let applied = false;
  for (const cs of candidates) {
    const host = cs.match(/@([^:/]+)/)?.[1] ?? 'unknown';
    const client = new Client({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      const { rows: tableRows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'geo_tags'
         ) as exists`
      );
      if (!tableRows[0]?.exists) {
        logger.warn('[migration-v15] geo_tags table missing — run migration-v14 / backend/supabase-migration-geo-tag.sql first.');
        applied = true;
        await client.end();
        break;
      }
      const { rows: colRows } = await client.query<{ found: number }>(
        `SELECT COUNT(*)::int AS found
           FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'geo_tags'
            AND column_name = ANY($1::text[])`,
        [REQUIRED_COLUMNS]
      );
      const missing = REQUIRED_COLUMNS.length - (colRows[0]?.found ?? 0);
      if (missing === 0) {
        // Columns exist, but the PostgREST schema cache may still be stale.
        logger.info('[migration-v15] already applied — refreshing PostgREST schema cache');
        await client.query(`NOTIFY pgrst, 'reload schema'`);
      } else {
        logger.info(`[migration-v15] Applying geo-tag fence snapshot columns (${missing} missing)...`);
        await client.query(MIGRATION_SQL);
        await client.query(`NOTIFY pgrst, 'reload schema'`);
        logger.info('[migration-v15] ✅ applied: geo_tags fence snapshot columns created');
      }
      applied = true;
      await client.end();
      break;
    } catch (err: any) {
      logger.warn(`[migration-v15] ${host} failed: ${String(err.message).slice(0, 140)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }
  if (applied) return;

  // 2. Fallback: check via PostgREST and log clear instructions
  try {
    const supabase = (await import('../config/supabase')).default;
    const { error } = await supabase.from('geo_tags').select('fence_center_lat').limit(1);
    if (error && (error.message?.toLowerCase().includes('does not exist') || error.message?.toLowerCase().includes('schema cache'))) {
      logger.error(
        '[migration-v15] geo_tags fence snapshot columns are missing from the database / PostgREST schema cache. ' +
          'Run backend/supabase-migration-geo-tag.sql in the Supabase SQL Editor (it includes NOTIFY pgrst, reload schema), then restart the server.',
      );
      return;
    }
    logger.info('[migration-v15] geo_tags fence snapshot columns schema is OK');
  } catch (error: any) {
    logger.error('[migration-v15] Migration check failed:', error?.message || error);
  }
}