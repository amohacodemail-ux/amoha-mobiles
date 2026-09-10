const { Client } = require('pg');

async function runMigration() {
  const connectionStrings = [
    'postgresql://postgres:ZIxCRgiJ6iDe4z0m@db.kwcsrninpsyxkryeuwsl.supabase.co:5432/postgres',
    'postgresql://postgres.kwcsrninpsyxkryeuwsl:ZIxCRgiJ6iDe4z0m@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres.kwcsrninpsyxkryeuwsl:ZIxCRgiJ6iDe4z0m@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ];

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

  for (const connStr of connectionStrings) {
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      const host = connStr.match(/@([^:\/]+)/)?.[1] || 'unknown';
      console.log('Trying:', host);
      await client.connect();
      console.log('Connected! Running migration...');
      await client.query(sql);
      console.log('Migration completed successfully!');
      
      await client.query("NOTIFY pgrst, 'reload schema'");
      console.log('Schema cache reloaded!');

      await client.end();
      return;
    } catch (error) {
      console.log('Failed:', error.message);
      try { await client.end(); } catch {}
    }
  }
  console.error('All connection attempts failed.');
}

runMigration();
