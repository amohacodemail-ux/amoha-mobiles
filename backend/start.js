// Smart error-capturing wrapper for Render deployment diagnostics
const http = require('http');
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

console.log('=== START.JS WRAPPER ===');
console.log('Node:', process.version);
console.log('PORT:', PORT);
console.log('CWD:', process.cwd());
console.log('========================');

try {
  require('./dist/server.js');
  serverStarted = true;
} catch (err) {
  logErr('REQUIRE_ERROR', err);
  startErrorServer();
}
