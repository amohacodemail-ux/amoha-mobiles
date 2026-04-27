/**
 * Shared auth helper — reads the token saved by global-setup.ts.
 *
 * Every spec file imports { authedCtx, getToken } from here instead of
 * calling the login API directly (which would trigger Supabase rate limits).
 */
import * as fs from 'fs';
import * as path from 'path';
import { Browser, BrowserContext, expect, Locator, Page } from '@playwright/test';

const TOKEN_FILE = path.join(__dirname, '..', '.auth', 'admin-tokens.json');
const ADMIN_URL  = process.env.ADMIN_URL || 'http://localhost:3003';

interface Tokens { token: string; refreshToken: string; }

let _cached: Tokens | null = null;

export function getTokens(): Tokens {
  if (_cached) return _cached;
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error(
      '[shared-auth] .auth/admin-tokens.json not found. ' +
      'Run the full test suite (global-setup runs login automatically).'
    );
  }
  _cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')) as Tokens;
  return _cached;
}

export function getToken(): string {
  return getTokens().token;
}

/** Create a new browser context pre-loaded with admin auth cookies. */
export async function authedCtx(browser: Browser): Promise<BrowserContext> {
  const { token, refreshToken } = getTokens();
  const domain = new URL(ADMIN_URL).hostname;
  const ctx = await browser.newContext();
  await ctx.addCookies([
    { name: 'admin_token',         value: token,        domain, path: '/' },
    { name: 'admin_refresh_token', value: refreshToken, domain, path: '/' },
  ]);
  return ctx;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export async function fetchWithRetry(
  input: string,
  init?: RequestInit,
  maxAttempts = 5,
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(input, init);
      if (!isRetriableStatus(response.status) || attempt === maxAttempts) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
    }

    await sleep(400 * attempt);
  }

  throw new Error(`fetchWithRetry exhausted for ${input}: ${String(lastError ?? 'unknown error')}`);
}

export async function gotoAndWaitFor(
  page: Page,
  url: string,
  readyLocator: (page: Page) => Locator,
  maxAttempts = 3,
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await page.goto(url, { waitUntil: 'networkidle' });
    try {
      await expect(readyLocator(page)).toBeVisible({ timeout: 10000 });
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(500 * attempt);
    }
  }
}
