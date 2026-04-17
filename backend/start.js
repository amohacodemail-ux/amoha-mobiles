// Smart error-capturing wrapper for Render deployment diagnostics
const http = require('http');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 10000;
let errorLog = [];
let serverStarted = false;

function logErr(label, err) {
  const msg = `[${new Date().toISOString()}] ${label}: ${err?.stack || err?.message || String(err)}`;
  errorLog.push(msg);
  console.error(msg);
}

// Capture all errors before anything else
process.on('uncaughtException', (err) => {
  logErr('UNCAUGHT_EXCEPTION', err);
  if (!serverStarted) startErrorServer();
});
process.on('unhandledRejection', (reason) => {
  logErr('UNHANDLED_REJECTION', reason);
  if (!serverStarted) startErrorServer();
});

// Error fallback server - keeps running so Render doesn't restart endlessly
function startErrorServer() {
  if (serverStarted) return;
  serverStarted = true;
  const s = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'error',
      nodeVersion: process.version,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'SET' : 'MISSING',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'MISSING',
        CORS_ORIGIN: process.env.CORS_ORIGIN ? 'SET' : 'MISSING',
      },
      errors: errorLog,
    }, null, 2));
  });
  s.listen(PORT, () => console.log(`Error server on port ${PORT}`));
}

/**
 * Run any pending startup migrations against the Supabase Postgres DB.
 * Non-blocking — if the connection fails, we log and continue.
 */
async function runStartupMigrations() {
  const migrationFile = path.join(__dirname, 'supabase-migration-v4.sql');
  if (!fs.existsSync(migrationFile)) {
    console.log('[migration] v4 file not found, skipping');
    return;
  }
  const sql = fs.readFileSync(migrationFile, 'utf8');

  // Derive project ref from SUPABASE_URL (https://<ref>.supabase.co)
  const supabaseUrl = process.env.SUPABASE_URL || '';
  const refMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  const ref = refMatch ? refMatch[1] : 'kwcsrninpsyxkryeuwsl';

  // DB password: prefer explicit env var, fall back to known password
  const dbPass = process.env.SUPABASE_DB_PASSWORD || 'ZIxCRgiJ6iDe4z0m';

  const candidates = [
    // Direct connection (works from Render/AWS)
    'postgresql://postgres:' + dbPass + '@db.' + ref + '.supabase.co:5432/postgres',
    // Session pooler - ap-south-1
    'postgresql://postgres.' + ref + ':' + dbPass + '@aws-0-ap-south-1.pooler.supabase.com:5432/postgres',
    // Session pooler - ap-southeast-1
    'postgresql://postgres.' + ref + ':' + dbPass + '@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
    // Session pooler - us-east-1
    'postgresql://postgres.' + ref + ':' + dbPass + '@aws-0-us-east-1.pooler.supabase.com:5432/postgres',
  ];

  for (const cs of candidates) {
    const host = cs.match(/@([^:/]+)/)?.[1] || 'unknown';
    const c = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
      await c.connect();
      console.log('[migration] connected to', host);

      // Check if migration is already applied (idempotent guard)
      const check = await c.query(
        "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_id'"
      );
      const isNullable = check.rows[0]?.is_nullable === 'YES';
      if (isNullable) {
        console.log('[migration] v4 already applied, skipping');
        await c.end();
        return;
      }

      await c.query(sql);
      console.log('[migration] v4 applied: order_items.product_id is now nullable ON DELETE SET NULL');
      await c.end();
      return;
    } catch (e) {
      console.log('[migration] ' + host + ' failed:', e.message.slice(0, 100));
      try { await c.end(); } catch (_) {}
    }
  }
  console.warn('[migration] v4 could not be applied automatically. Run supabase-migration-v4.sql manually in Supabase SQL Editor.');
}

console.log('=== START.JS WRAPPER ===');
console.log('Node:', process.version);
console.log('PORT:', PORT);
console.log('CWD:', process.cwd());
console.log('========================');

// Run migrations then start the server
runStartupMigrations()
  .catch((e) => console.error('[migration] unexpected error:', e.message))
  .finally(() => {
    try {
      require('./dist/server.js');
      serverStarted = true;
    } catch (err) {
      logErr('REQUIRE_ERROR', err);
      startErrorServer();
    }
  });

