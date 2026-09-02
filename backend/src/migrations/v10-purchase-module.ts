import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Create goods_receipt_notes table
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_number VARCHAR(255) NOT NULL UNIQUE,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goods_receipt_note_items table
CREATE TABLE IF NOT EXISTS goods_receipt_note_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  grn_id UUID NOT NULL REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  ordered_qty INTEGER NOT NULL DEFAULT 0,
  received_qty INTEGER NOT NULL DEFAULT 0,
  damaged_qty INTEGER NOT NULL DEFAULT 0,
  pending_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_returns table
CREATE TABLE IF NOT EXISTS purchase_returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_number VARCHAR(255) NOT NULL UNIQUE,
  po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
  grn_id UUID REFERENCES goods_receipt_notes(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  return_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_return_items table
CREATE TABLE IF NOT EXISTS purchase_return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  return_qty INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_payments table
CREATE TABLE IF NOT EXISTS purchase_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(100) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reference_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_grn_po_id ON goods_receipt_notes(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_supplier_id ON goods_receipt_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pr_supplier_id ON purchase_returns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pr_po_id ON purchase_returns(po_id);
CREATE INDEX IF NOT EXISTS idx_pp_po_id ON purchase_payments(po_id);
CREATE INDEX IF NOT EXISTS idx_pp_supplier_id ON purchase_payments(supplier_id);
`;

/** Build candidate pg connection strings from env vars. */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) {
    logger.warn('[migration-v10] SUPABASE_DB_PASSWORD not set — skipping auto-migration');
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

export async function runV10Migration(): Promise<void> {
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

      // Check if goods_receipt_notes already exists
      const { rows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = 'goods_receipt_notes'
         ) as exists`
      );

      if (rows[0]?.exists) {
        logger.info('[migration-v10] already applied — Purchase Module tables exist');
        await client.end();
        return;
      }

      logger.info('[migration-v10] Creating Purchase Module tables (GRN, Returns, Payments)...');
      await client.query(MIGRATION_SQL);
      logger.info('[migration-v10] ✅ applied: Purchase Module tables created successfully');
      await client.end();
      return;
    } catch (err: any) {
      logger.warn(`[migration-v10] ${host} failed: ${String(err.message).slice(0, 120)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }

  logger.warn(
    '[migration-v10] ⚠️  Could not apply automatically. ' +
    'Run the migration SQL manually in Supabase SQL Editor.'
  );
}
