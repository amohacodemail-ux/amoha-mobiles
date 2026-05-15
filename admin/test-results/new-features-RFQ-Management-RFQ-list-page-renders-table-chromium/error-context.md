# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: new-features.spec.ts >> RFQ Management >> RFQ list page renders table
- Location: e2e\new-features.spec.ts:134:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/rfq
Call log:
  - navigating to "http://localhost:3003/rfq", waiting until "networkidle"

```

# Test source

```ts
  1  | /**
  2  |  * Shared auth helper — reads the token saved by global-setup.ts.
  3  |  *
  4  |  * Every spec file imports { authedCtx, getToken } from here instead of
  5  |  * calling the login API directly (which would trigger Supabase rate limits).
  6  |  */
  7  | import * as fs from 'fs';
  8  | import * as path from 'path';
  9  | import { Browser, BrowserContext, expect, Locator, Page } from '@playwright/test';
  10 | 
  11 | const TOKEN_FILE = path.join(__dirname, '..', '.auth', 'admin-tokens.json');
  12 | const ADMIN_URL  = process.env.ADMIN_URL || 'http://localhost:3003';
  13 | 
  14 | interface Tokens { token: string; refreshToken: string; }
  15 | 
  16 | let _cached: Tokens | null = null;
  17 | 
  18 | export function getTokens(): Tokens {
  19 |   if (_cached) return _cached;
  20 |   if (!fs.existsSync(TOKEN_FILE)) {
  21 |     throw new Error(
  22 |       '[shared-auth] .auth/admin-tokens.json not found. ' +
  23 |       'Run the full test suite (global-setup runs login automatically).'
  24 |     );
  25 |   }
  26 |   _cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')) as Tokens;
  27 |   return _cached;
  28 | }
  29 | 
  30 | export function getToken(): string {
  31 |   return getTokens().token;
  32 | }
  33 | 
  34 | /** Create a new browser context pre-loaded with admin auth cookies. */
  35 | export async function authedCtx(browser: Browser): Promise<BrowserContext> {
  36 |   const { token, refreshToken } = getTokens();
  37 |   const domain = new URL(ADMIN_URL).hostname;
  38 |   const ctx = await browser.newContext();
  39 |   await ctx.addCookies([
  40 |     { name: 'admin_token',         value: token,        domain, path: '/' },
  41 |     { name: 'admin_refresh_token', value: refreshToken, domain, path: '/' },
  42 |   ]);
  43 |   return ctx;
  44 | }
  45 | 
  46 | function sleep(ms: number): Promise<void> {
  47 |   return new Promise((resolve) => setTimeout(resolve, ms));
  48 | }
  49 | 
  50 | function isRetriableStatus(status: number): boolean {
  51 |   return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
  52 | }
  53 | 
  54 | export async function fetchWithRetry(
  55 |   input: string,
  56 |   init?: RequestInit,
  57 |   maxAttempts = 5,
  58 | ): Promise<Response> {
  59 |   let lastError: unknown;
  60 | 
  61 |   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  62 |     try {
  63 |       const response = await fetch(input, init);
  64 |       if (!isRetriableStatus(response.status) || attempt === maxAttempts) {
  65 |         return response;
  66 |       }
  67 |     } catch (error) {
  68 |       lastError = error;
  69 |       if (attempt === maxAttempts) {
  70 |         throw error;
  71 |       }
  72 |     }
  73 | 
  74 |     await sleep(400 * attempt);
  75 |   }
  76 | 
  77 |   throw new Error(`fetchWithRetry exhausted for ${input}: ${String(lastError ?? 'unknown error')}`);
  78 | }
  79 | 
  80 | export async function gotoAndWaitFor(
  81 |   page: Page,
  82 |   url: string,
  83 |   readyLocator: (page: Page) => Locator,
  84 |   maxAttempts = 3,
  85 | ): Promise<void> {
  86 |   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
> 87 |     await page.goto(url, { waitUntil: 'networkidle' });
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3003/rfq
  88 |     try {
  89 |       await expect(readyLocator(page)).toBeVisible({ timeout: 10000 });
  90 |       return;
  91 |     } catch (error) {
  92 |       if (attempt === maxAttempts) {
  93 |         throw error;
  94 |       }
  95 |       await sleep(500 * attempt);
  96 |     }
  97 |   }
  98 | }
  99 | 
```