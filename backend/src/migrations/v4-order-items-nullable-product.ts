/**
 * V4 Migration: Make order_items.product_id nullable with ON DELETE SET NULL.
 *
 * Why: Products can now be hard-deleted even when referenced by past orders.
 * Safety: order_items already stores product_name + product_image as snapshot
 *         columns, so order history display is unaffected.
 *
 * This migration is idempotent — it checks whether the column is already
 * nullable before attempting any DDL. It runs at server startup and is
 * skipped silently if already applied or if the DB connection fails.
 */

import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Drop NOT NULL constraint on order_items.product_id
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;

-- Drop old FK (name may vary – dynamic lookup)
DO $$
DECLARE con_name TEXT;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'order_items'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[(
      SELECT attnum FROM pg_attribute
      WHERE attrelid = 'order_items'::regclass AND attname = 'product_id'
    )]::smallint[];
  IF con_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE order_items DROP CONSTRAINT ' || quote_ident(con_name);
  END IF;
END $$;

-- Re-add FK with ON DELETE SET NULL
ALTER TABLE order_items
  ADD CONSTRAINT fk_order_items_product
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
`;

/** Build candidate pg connection strings from env vars + known fallback. */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD ?? 'ZIxCRgiJ6iDe4z0m';

  return [
    // Direct connection (works from Render/AWS same-region)
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`,
    // Session pooler – common Render region
    `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  ];
}

export async function runV4Migration(): Promise<void> {
  const candidates = buildCandidates();
  if (candidates.length === 0) {
    logger.warn('[migration-v4] SUPABASE_URL not set — skipping');
    return;
  }

  for (const cs of candidates) {
    const host = cs.match(/@([^:/]+)/)?.[1] ?? 'unknown';
    const client = new Client({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });

    try {
      await client.connect();

      // Idempotency check: is product_id already nullable?
      const { rows } = await client.query<{ is_nullable: string }>(
        `SELECT is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'order_items'
           AND column_name  = 'product_id'`,
      );

      if (rows[0]?.is_nullable === 'YES') {
        logger.info('[migration-v4] already applied — product_id is nullable');
        await client.end();
        return;
      }

      await client.query(MIGRATION_SQL);
      logger.info('[migration-v4] ✅ applied: order_items.product_id is now nullable ON DELETE SET NULL');
      await client.end();
      return;
    } catch (err: any) {
      logger.warn(`[migration-v4] ${host} failed: ${String(err.message).slice(0, 120)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }

  logger.warn(
    '[migration-v4] ⚠️  Could not apply automatically. ' +
    'Run backend/supabase-migration-v4.sql in Supabase SQL Editor to enable hard delete for products with order history.',
  );
}
