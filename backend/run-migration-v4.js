const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const sql = fs.readFileSync(path.join(__dirname, 'supabase-migration-v4.sql'), 'utf8');
const pass = 'ZIxCRgiJ6iDe4z0m';
const proj = 'kwcsrninpsyxkryeuwsl';

const connections = [
  'postgresql://postgres.' + proj + ':' + pass + '@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.' + proj + ':' + pass + '@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.' + proj + ':' + pass + '@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  'postgresql://postgres.' + proj + ':' + pass + '@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.' + proj + ':' + pass + '@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  'postgresql://postgres.' + proj + ':' + pass + '@aws-0-eu-west-1.pooler.supabase.com:6543/postgres',
];

(async () => {
  for (const cs of connections) {
    const host = cs.match(/@([^:/]+)/)?.[1];
    const port = cs.match(/:(\d+)\//)?.[1];
    const c = new Client({
      connectionString: cs,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
    });
    try {
      process.stdout.write('Trying ' + host + ':' + port + '... ');
      await c.connect();
      console.log('Connected!');
      await c.query(sql);
      console.log('Migration v4 applied successfully!');
      await c.end();
      process.exit(0);
    } catch (e) {
      console.log('FAIL: ' + e.message.slice(0, 100));
      try { await c.end(); } catch (_) {}
    }
  }
  console.error('All connections failed. Apply supabase-migration-v4.sql manually in Supabase SQL Editor.');
  process.exit(1);
})();
