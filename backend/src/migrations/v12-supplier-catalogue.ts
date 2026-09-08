import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS supplier_catalogues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  unit VARCHAR(50),
  supplier_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  moq INTEGER NOT NULL DEFAULT 1,
  available_stock INTEGER NOT NULL DEFAULT 0,
  delivery_time_days INTEGER,
  image_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  mapped_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_catalogues_supplier_id ON supplier_catalogues(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_catalogues_category ON supplier_catalogues(category);
CREATE INDEX IF NOT EXISTS idx_supplier_catalogues_status ON supplier_catalogues(status);
`;

/** Build candidate pg connection strings from env vars. */
function buildCandidates(): string[] {
  const supabaseUrl = process.env.SUPABASE_URL ?? '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : '';
  if (!ref) return [];

  const pass = process.env.SUPABASE_DB_PASSWORD;
  if (!pass) {
    logger.warn('[migration-v12] SUPABASE_DB_PASSWORD not set — skipping auto-migration');
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

export async function runV12Migration(): Promise<void> {
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

      // Check if supplier_catalogues already exists
      const { rows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = 'supplier_catalogues'
         ) as exists`
      );

      if (rows[0]?.exists) {
        logger.info('[migration-v12] already applied — Supplier Catalogue table exists');
        await client.end();
        return;
      }

      logger.info('[migration-v12] Creating Supplier Catalogue table...');
      await client.query(MIGRATION_SQL);
      logger.info('[migration-v12] ✅ applied: Supplier Catalogue table created successfully');
      await client.end();
      return;
    } catch (err: any) {
      logger.warn(`[migration-v12] ${host} failed: ${String(err.message).slice(0, 120)}`);
      try { await client.end(); } catch (_) { /* ignore */ }
    }
  }

  logger.warn(
    '[migration-v12] ⚠️  Could not apply automatically. ' +
    'Run the migration SQL manually in Supabase SQL Editor.'
  );
}
