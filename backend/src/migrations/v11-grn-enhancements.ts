import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Update goods_receipt_notes
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS invoice_challan_number VARCHAR(255);
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS warehouse_location VARCHAR(255);
ALTER TABLE goods_receipt_notes ADD COLUMN IF NOT EXISTS received_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update goods_receipt_note_items
ALTER TABLE goods_receipt_note_items RENAME COLUMN damaged_qty TO rejected_qty;
ALTER TABLE goods_receipt_note_items ADD COLUMN IF NOT EXISTS accepted_qty INTEGER NOT NULL DEFAULT 0;
ALTER TABLE goods_receipt_note_items ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
ALTER TABLE goods_receipt_note_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE goods_receipt_note_items ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Update purchase_order_items
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS received_qty INTEGER NOT NULL DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS pending_qty INTEGER NOT NULL DEFAULT 0;

-- Optional: backfill pending_qty in purchase_order_items for existing records
UPDATE purchase_order_items SET pending_qty = quantity - received_qty WHERE pending_qty = 0;
`;

/** Build candidate pg connection strings from env vars. */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD || 'ZIxCRgiJ6iDe4z0m';
  if (!pass) {
    logger.warn('[migration-v11] SUPABASE_DB_PASSWORD not set — skipping auto-migration');
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

/** Execute the migration */
export async function up(): Promise<void> {
  const candidates = buildCandidates();
  if (candidates.length === 0) return;

  for (const connectionString of candidates) {
    const client = new Client({ 
      connectionString, 
      statement_timeout: 15000,
      ssl: { rejectUnauthorized: false } 
    });
    try {
      await client.connect();
      logger.info(`[migration-v11] Connected to DB successfully.`);

      // Execute migration
      await client.query('BEGIN');
      await client.query(MIGRATION_SQL);
      await client.query('COMMIT');

      logger.info('[migration-v11] v11-grn-enhancements migrated successfully.');
      await client.end();
      return; // Stop on first success
    } catch (err: any) {
      await client.end().catch(() => {});
      logger.warn(`[migration-v11] Connection or query failed on one pooler candidate: ${err.message}`);
    }
  }
  logger.error('[migration-v11] Failed to apply migration on all connection candidates.');
}

if (require.main === module) {
  require('dotenv').config();
  up()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
