import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- 1. Update purchase_orders table status constraint
-- We need to drop the constraint and add a new one, but PostgreSQL constraints need to be dropped by name.
-- To make this idempotent and safe, we can just alter the column type if it's not an enum, or in this case it's a CHECK constraint.
-- Let's drop the constraint if it exists. Since Supabase creates constraints automatically with naming conventions,
-- we'll dynamically remove any check constraints on the status column of purchase_orders, and re-add it.

DO $$ 
DECLARE 
    const_name text;
BEGIN
    SELECT conname INTO const_name 
    FROM pg_constraint 
    WHERE conrelid = 'purchase_orders'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%status%';
    
    IF const_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE purchase_orders DROP CONSTRAINT ' || const_name;
    END IF;
END $$;

ALTER TABLE purchase_orders 
  ADD CONSTRAINT purchase_orders_status_check 
  CHECK (status IN ('draft','sent','confirmed','accepted','rejected','preparing','dispatched','in_transit','delivered','partially_received','received','cancelled'));

-- 2. Add delivery and tracking fields to purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS dispatch_date TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_response_date TIMESTAMPTZ;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS reject_reason TEXT;

-- 3. Create purchase_invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(255) NOT NULL,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'partially_paid', 'paid')),
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(po_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_po_id ON purchase_invoices(po_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);
`;

/** Build candidate pg connection strings from env vars. */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) {
    logger.warn('[migration-v11] SUPABASE_DB_PASSWORD not set — skipping auto-migration');
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

export async function runV11Migration(): Promise<void> {
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

      // Check if purchase_invoices already exists
      const { rows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = 'purchase_invoices'
         ) as exists`
      );

      if (rows[0]?.exists) {
        logger.info('[migration-v11] already applied — Supplier Workflow tables exist');
        await client.end();
        return;
      }

      logger.info('[migration-v11] Creating Supplier Workflow tables and fields...');
      await client.query(MIGRATION_SQL);
      logger.info('[migration-v11] ✅ applied: Supplier Workflow tables created successfully');
      await client.end();
      return;
    } catch (err: any) {
      logger.warn(`[migration-v11] ${host} failed: ${String(err.message).slice(0, 120)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }

  logger.warn(
    '[migration-v11] ⚠️  Could not apply automatically. ' +
    'Run the migration SQL manually in Supabase SQL Editor.'
  );
}
