import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Live Location Tracking: one "latest live location" row per salesperson.
-- Upserted continuously while a salesperson's browser watchPosition session is active.
CREATE TABLE IF NOT EXISTS live_locations (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name              TEXT         NOT NULL DEFAULT '',
  latitude               NUMERIC(10,8),
  longitude              NUMERIC(11,8),
  accuracy_meters        NUMERIC(10,2),
  timestamp              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  tracking_status        TEXT         NOT NULL DEFAULT 'not_tracking'
    CHECK (tracking_status IN ('not_tracking','tracking_active','tracking_stopped','location_permission_denied','location_unavailable','last_location_available')),
  geofence_status        TEXT
    CHECK (geofence_status IS NULL OR geofence_status IN ('inside','outside')),
  distance_from_geofence NUMERIC(12,2),
  fence_id               UUID         REFERENCES geo_fences(id) ON DELETE SET NULL,
  fence_name             TEXT         NOT NULL DEFAULT '',
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT live_locations_salesperson_unique UNIQUE (salesperson_id)
);

CREATE INDEX IF NOT EXISTS idx_live_locations_salesperson ON live_locations(salesperson_id, updated_at DESC);

-- Refresh PostgREST schema cache so the API sees the new table immediately
NOTIFY pgrst, 'reload schema';
`;

/** Build candidate pg connection strings from env vars (same pattern as v14/v15). */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) {
    logger.warn('[migration-v16] SUPABASE_DB_PASSWORD not set — skipping auto-apply. Run backend/supabase-migration-live-locations.sql in Supabase SQL Editor.');
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

export async function runV16Migration(): Promise<void> {
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
           WHERE table_schema = 'public' AND table_name = 'live_locations'
         ) as exists`
      );
      if (rows[0]?.exists) {
        logger.info('[migration-v16] already applied — refreshing PostgREST schema cache');
        await client.query(`NOTIFY pgrst, 'reload schema'`);
      } else {
        logger.info('[migration-v16] Applying Live Location Tracking schema...');
        await client.query(MIGRATION_SQL);
        logger.info('[migration-v16] ✅ applied: live_locations table created');
        await client.query(`NOTIFY pgrst, 'reload schema'`);
      }
      applied = true;
      await client.end();
      break;
    } catch (err: any) {
      logger.warn(`[migration-v16] ${host} failed: ${String(err.message).slice(0, 140)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }
  if (applied) return;

  // 2. Fallback: check via PostgREST and log clear instructions
  try {
    const supabase = (await import('../config/supabase')).default;
    const { error } = await supabase.from('live_locations').select('id').limit(1);
    if (error && (error.message?.toLowerCase().includes('does not exist') || error.message?.toLowerCase().includes('schema cache'))) {
      logger.error(
        '[migration-v16] live_locations table is missing from the database / PostgREST schema cache. ' +
          'Run backend/supabase-migration-live-locations.sql in the Supabase SQL Editor (it includes NOTIFY pgrst, reload schema), then restart the server.',
      );
      return;
    }
    logger.info('[migration-v16] live_locations schema is OK');
  } catch (error: any) {
    logger.error('[migration-v16] Migration check failed:', error?.message || error);
  }
}