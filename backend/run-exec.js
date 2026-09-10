import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const sql = `
    ALTER TABLE service_requests 
    ADD COLUMN IF NOT EXISTS "isWalkIn" BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS "imeiOrSerialNumber" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "customerPhotoUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "devicePhotoUrl" TEXT,
    ADD COLUMN IF NOT EXISTS "serviceCharges" NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "partsCharges" NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(10, 2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "paymentMethod" VARCHAR(50),
    ADD COLUMN IF NOT EXISTS "paymentStatus" VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS "invoiceNumber" VARCHAR(100),
    ADD COLUMN IF NOT EXISTS "invoiceDate" TIMESTAMP WITH TIME ZONE;
  `;

  console.log("Running SQL...");
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  console.log("Result:", data, error);

  console.log("Reloading schema cache...");
  const { data: d2, error: e2 } = await supabase.rpc('exec_sql', { query: "NOTIFY pgrst, 'reload schema';" });
  console.log("Reload Result:", d2, e2);
}

run();
