require('dotenv').config();
const { Client } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL || '';
const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
const ref = refMatch ? refMatch[1] : '';
const pass = process.env.SUPABASE_DB_PASSWORD;

// Try to use the pooler connection string format as in migration script
const cs = `postgresql://postgres.${ref}:${pass}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`;

const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });

client.connect().then(() => {
  console.log('Connected to pg...');
  return client.query("NOTIFY pgrst, 'reload schema'");
}).then(() => {
  console.log('Schema reloaded!');
  process.exit(0);
}).catch(err => {
  console.error('Failed with pooler:', err.message);
  
  // fallback to direct connection
  const csFallback = `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/postgres`;
  const fallbackClient = new Client({ connectionString: csFallback, ssl: { rejectUnauthorized: false } });
  
  fallbackClient.connect().then(() => {
    return fallbackClient.query("NOTIFY pgrst, 'reload schema'");
  }).then(() => {
    console.log('Schema reloaded via fallback!');
    process.exit(0);
  }).catch(e => {
    console.error('Total failure:', e.message);
    process.exit(1);
  });
});
