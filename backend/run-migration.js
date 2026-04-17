const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Try both connection formats
  const connectionStrings = [
    'postgresql://postgres:ZIxCRgiJ6iDe4z0m@db.kwcsrninpsyxkryeuwsl.supabase.co:5432/postgres',
    'postgresql://postgres.kwcsrninpsyxkryeuwsl:ZIxCRgiJ6iDe4z0m@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres.kwcsrninpsyxkryeuwsl:ZIxCRgiJ6iDe4z0m@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  ];

  const sql = fs.readFileSync(path.join(__dirname, 'supabase-migration.sql'), 'utf8');

  for (const connStr of connectionStrings) {
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    try {
      const host = connStr.match(/@([^:\/]+)/)?.[1] || 'unknown';
      console.log(`Trying: ${host}...`);
      await client.connect();
      console.log('Connected! Running migration...');
      await client.query(sql);
      console.log('Migration completed successfully!');
      await client.end();
      return;
    } catch (error) {
      console.log(`  Failed: ${error.message}`);
      try { await client.end(); } catch {}
    }
  }
  console.error('All connection attempts failed.');
}

runMigration();
