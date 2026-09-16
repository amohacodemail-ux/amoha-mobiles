import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Geo-Tag / Geo-Fence location history
CREATE TABLE IF NOT EXISTS geo_tags (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name       TEXT         NOT NULL DEFAULT '',
  latitude        NUMERIC(10,8) NOT NULL,
  longitude       NUMERIC(11,8) NOT NULL,
  accuracy_meters NUMERIC(10,2),
  address         TEXT         NOT NULL DEFAULT '',
  visit_type      TEXT         NOT NULL DEFAULT 'other'
    CHECK (visit_type IN ('productive','non_productive','office','travel','other')),
  fence_id        UUID         REFERENCES geo_fences(id) ON DELETE SET NULL,
  fence_name      TEXT         NOT NULL DEFAULT '',
  in_fence        BOOLEAN,
  distance_meters NUMERIC(12,2),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_tags_user    ON geo_tags(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_tags_created ON geo_tags(created_at DESC);

-- Geo-Fence: optional per-salesperson assignment (NULL = global "applies to all")
ALTER TABLE geo_fences ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_geo_fences_assigned ON geo_fences(assigned_user_id);

-- Refresh PostgREST schema cache so the API sees the new table immediately
NOTIFY pgrst, 'reload schema';
`;

/** Build candidate pg connection strings from env vars (same pattern as v12). */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) {
    logger.warn('[migration-v14] SUPABASE_DB_PASSWORD not set — skipping auto-apply. Run backend/supabase-migration-geo-tag.sql in Supabase SQL Editor.');
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

export async function runV14Migration(): Promise<void> {
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
      const { rows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'geo_tags'
         ) as exists`
      );
      const { rows: colRows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'geo_fences' AND column_name = 'assigned_user_id'
         ) as exists`
      );
      if (rows[0]?.exists && colRows[0]?.exists) {
        // Objects exist, but the PostgREST schema cache may still be stale
        // (e.g. the column was created outside this migration / via SQL editor).
        // Always reload — otherwise requests fail with PGRST204 "not in schema cache".
        logger.info('[migration-v14] already applied — refreshing PostgREST schema cache');
        await client.query(`NOTIFY pgrst, 'reload schema'`);
      } else {
        logger.info('[migration-v14] Applying Geo-Tag schema...');
        await client.query(MIGRATION_SQL);
        logger.info('[migration-v14] ✅ applied: geo_tags + geo_fences.assigned_user_id created');
        await client.query(`NOTIFY pgrst, 'reload schema'`);
      }
      applied = true;
      await client.end();
      break;
    } catch (err: any) {
      logger.warn(`[migration-v14] ${host} failed: ${String(err.message).slice(0, 140)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }
  if (applied) return;

  // 2. Fallback: check via PostgREST and log clear instructions
  try {
    const supabase = (await import('../config/supabase')).default;
    const { error: tagsError } = await supabase.from('geo_tags').select('id').limit(1);
    const { error: fenceColError } = await supabase.from('geo_fences').select('assigned_user_id').limit(1);
    const schemaIssue = [tagsError, fenceColError]
      .map((e) => e?.message?.toLowerCase() ?? '')
      .some((m) => m.includes('does not exist') || m.includes('schema cache'));
    if (schemaIssue) {
      logger.error(
        '[migration-v14] geo_tags table or geo_fences.assigned_user_id is missing from the database / PostgREST schema cache. ' +
          'Run backend/supabase-migration-geo-tag.sql in the Supabase SQL Editor (it includes NOTIFY pgrst, reload schema), then restart the server.',
      );
      return;
    }
    logger.info('[migration-v14] geo_tags + geo_fences.assigned_user_id schema is OK');
  } catch (error: any) {
    logger.error('[migration-v14] Migration check failed:', error?.message || error);
  }
}