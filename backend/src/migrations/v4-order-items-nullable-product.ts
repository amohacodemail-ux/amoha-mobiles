/**
 * V4 Migration: Make product FK columns nullable with ON DELETE SET NULL
 * in tables that reference products for historical/audit purposes.
 *
 * Tables modified:
 *   - order_items.product_id
 *   - return_request_items.product_id
 *   - purchase_order_items.product_id
 *   - inventory_movements.product_id
 *   - inventory_audit_log.product_id
 *   - supplier_entries.converted_product_id
 *
 * Why: Products can now be hard-deleted even when referenced by past orders,
 *      returns, and audit logs. Snapshot columns preserve display data.
 *
 * This migration is idempotent — skipped if already applied.
 * Runs at server startup and is skipped silently on failure.
 */

import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Helper function
CREATE OR REPLACE FUNCTION _tmp_drop_fk(_tbl TEXT, _col TEXT) RETURNS void AS $$
DECLARE con_name TEXT;
BEGIN
  SELECT c.conname INTO con_name
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = _tbl::regclass
    AND c.contype = 'f'
    AND a.attname = _col
  LIMIT 1;
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', _tbl, con_name);
  END IF;
END $$ LANGUAGE plpgsql;

-- order_items
ALTER TABLE order_items ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('order_items', 'product_id');
ALTER TABLE order_items ADD CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- return_request_items
ALTER TABLE return_request_items ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('return_request_items', 'product_id');
ALTER TABLE return_request_items ADD CONSTRAINT fk_return_request_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- purchase_order_items
ALTER TABLE purchase_order_items ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('purchase_order_items', 'product_id');
ALTER TABLE purchase_order_items ADD CONSTRAINT fk_purchase_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- inventory_movements
ALTER TABLE inventory_movements ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('inventory_movements', 'product_id');
ALTER TABLE inventory_movements ADD CONSTRAINT fk_inventory_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- inventory_audit_log
ALTER TABLE inventory_audit_log ALTER COLUMN product_id DROP NOT NULL;
SELECT _tmp_drop_fk('inventory_audit_log', 'product_id');
ALTER TABLE inventory_audit_log ADD CONSTRAINT fk_inventory_audit_log_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- supplier_entries
SELECT _tmp_drop_fk('supplier_entries', 'converted_product_id');
ALTER TABLE supplier_entries ADD CONSTRAINT fk_supplier_entries_product FOREIGN KEY (converted_product_id) REFERENCES products(id) ON DELETE SET NULL;

-- Cleanup
DROP FUNCTION _tmp_drop_fk(TEXT, TEXT);
`;

/** Build candidate pg connection strings from env vars. */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) {
    logger.warn('[migration-v4] SUPABASE_DB_PASSWORD not set — skipping auto-migration');
    return [];
  }

  return [
    // Direct connection (IPv6)
    `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`,
    // Pooler – common regions (session mode, port 5432 — supports DDL)
    `postgresql://postgres.${ref}:${pass}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${pass}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  ];
}

export async function runV4Migration(): Promise<void> {
  const candidates = buildCandidates();
  if (candidates.length === 0) {
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

      // Idempotency check: count how many target columns are still NOT nullable
      const { rows } = await client.query<{ pending: string }>(
        `SELECT count(*) as pending
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND (table_name, column_name) IN (
             ('order_items','product_id'),
             ('return_request_items','product_id'),
             ('purchase_order_items','product_id'),
             ('inventory_movements','product_id'),
             ('inventory_audit_log','product_id')
           )
           AND is_nullable = 'NO'`,
      );

      if (Number(rows[0]?.pending) === 0) {
        logger.info('[migration-v4] already applied — all product FK columns are nullable');
        await client.end();
        return;
      }

      await client.query(MIGRATION_SQL);
      logger.info('[migration-v4] ✅ applied: all product FK columns now nullable ON DELETE SET NULL');
      await client.end();
      return;
    } catch (err: any) {
      logger.warn(`[migration-v4] ${host} failed: ${String(err.message).slice(0, 120)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }

  logger.warn(
    '[migration-v4] ⚠️  Could not apply automatically. ' +
    'Run backend/supabase-migration-v4.sql in Supabase SQL Editor to enable hard delete.',
  );
}
