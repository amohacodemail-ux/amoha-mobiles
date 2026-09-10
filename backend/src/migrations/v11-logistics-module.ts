import { Client } from 'pg';
import logger from '../utils/logger.util';

const MIGRATION_SQL = `
-- Add assigned_person_id and assignment_status to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS assigned_person_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assignment_status VARCHAR(50) DEFAULT 'Pending';

-- Create pickup_requests table
CREATE TABLE IF NOT EXISTS pickup_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id VARCHAR(255) NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  requested_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_orders_assigned_person ON orders(assigned_person_id);
CREATE INDEX IF NOT EXISTS idx_pickup_order_id ON pickup_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_pickup_user_id ON pickup_requests(user_id);
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

      // Check if pickup_requests already exists
      const { rows } = await client.query<{ exists: boolean }>(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = 'pickup_requests'
         ) as exists`
      );

      if (rows[0]?.exists) {
        logger.info('[migration-v11] already applied — Logistics Module tables exist');
        await client.end();
        return;
      }

      logger.info('[migration-v11] Creating Logistics Module tables (Pickup Requests) & Modifying Orders...');
      await client.query(MIGRATION_SQL);
      logger.info('[migration-v11] ✅ applied: Logistics Module tables created successfully');
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
