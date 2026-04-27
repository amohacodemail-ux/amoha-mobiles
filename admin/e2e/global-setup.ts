/**
 * Playwright Global Setup — runs ONCE before all tests.
 *
 * Calls the backend login API a single time and saves the token to
 * .auth/admin-tokens.json so every spec file can read it without
 * making additional login calls (which triggers Supabase rate limiting).
 */
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local into process.env (same as playwright.local.config.ts does)
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

const API_URL        = process.env.API_URL        || 'http://localhost:5001/api';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const TOKEN_FILE     = path.join(__dirname, '..', '.auth', 'admin-tokens.json');

async function globalSetup() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn('[global-setup] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping login');
    return;
  }

  const resp = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`[global-setup] Login failed ${resp.status}: ${text}`);
  }

  const json = await resp.json() as any;
  const token        = json.token        ?? json.data?.token        ?? null;
  const refreshToken = json.refreshToken ?? json.data?.refreshToken ?? '';

  if (!token) throw new Error('[global-setup] No token in login response');

  fs.mkdirSync(path.dirname(TOKEN_FILE), { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, refreshToken }), 'utf-8');
  console.log('[global-setup] Admin token saved to .auth/admin-tokens.json');
}

export default globalSetup;
