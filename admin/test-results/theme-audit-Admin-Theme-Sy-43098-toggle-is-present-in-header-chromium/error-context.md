# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme-audit.spec.ts >> Admin Theme System Validation >> TEST 10: Theme Toggle UI >> Theme toggle is present in header
- Location: e2e\theme-audit.spec.ts:394:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[aria-label*="theme" i], button[class*="theme"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[aria-label*="theme" i], button[class*="theme"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - heading "Amoha Admin" [level=1] [ref=e9]
      - paragraph [ref=e10]: Sign in to your admin account
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: Email Address
          - generic [ref=e15]:
            - img [ref=e17]
            - textbox "admin@amoha.com" [ref=e20]
        - generic [ref=e21]:
          - generic [ref=e22]: Password
          - generic [ref=e23]:
            - img [ref=e25]
            - textbox "••••••••" [ref=e28]
            - button [ref=e29] [cursor=pointer]:
              - img [ref=e30]
        - button "Sign In to Admin Panel" [ref=e33] [cursor=pointer]
      - paragraph [ref=e35]: Protected route — Admin access only
  - alert [ref=e36]
```

# Test source

```ts
  312 |       
  313 |       page.on('console', (msg) => {
  314 |         if (msg.type() === 'error') {
  315 |           errors.push(msg.text());
  316 |         }
  317 |       });
  318 |       
  319 |       await page.goto('/dashboard');
  320 |       await page.waitForLoadState('networkidle');
  321 |       
  322 |       // Handle login
  323 |       if (page.url().includes('/login')) {
  324 |         const emailInput = page.locator('input[type="email"]').first();
  325 |         if (await emailInput.isVisible().catch(() => false)) {
  326 |           await emailInput.fill('admin@amoha.com');
  327 |           await page.locator('input[type="password"]').first().fill('password');
  328 |           await page.locator('button[type="submit"]').first().click();
  329 |           await page.waitForLoadState('networkidle');
  330 |           await page.goto('/dashboard');
  331 |         }
  332 |       }
  333 |       
  334 |       // Switch themes
  335 |       await setTheme(page, 'dark');
  336 |       await page.waitForTimeout(500);
  337 |       
  338 |       await setTheme(page, 'light');
  339 |       await page.waitForTimeout(500);
  340 |       
  341 |       // Filter for theme-related errors
  342 |       const themeErrors = errors.filter(e => 
  343 |         e.toLowerCase().includes('theme') || 
  344 |         e.toLowerCase().includes('dark') || 
  345 |         e.toLowerCase().includes('light') ||
  346 |         e.toLowerCase().includes('color') ||
  347 |         e.toLowerCase().includes('hsl') ||
  348 |         e.toLowerCase().includes('css')
  349 |       );
  350 |       
  351 |       expect(themeErrors).toHaveLength(0);
  352 |     });
  353 |   });
  354 | 
  355 |   test.describe('TEST 9: Mobile Responsive Theme', () => {
  356 |     test('Theme works on mobile viewport', async ({ page }) => {
  357 |       await page.setViewportSize({ width: 375, height: 667 });
  358 |       
  359 |       await setTheme(page, 'dark');
  360 |       await page.goto('/dashboard');
  361 |       await page.waitForLoadState('networkidle');
  362 |       
  363 |       // Handle login
  364 |       if (page.url().includes('/login')) {
  365 |         const emailInput = page.locator('input[type="email"]').first();
  366 |         if (await emailInput.isVisible().catch(() => false)) {
  367 |           await emailInput.fill('admin@amoha.com');
  368 |           await page.locator('input[type="password"]').first().fill('password');
  369 |           await page.locator('button[type="submit"]').first().click();
  370 |           await page.waitForLoadState('networkidle');
  371 |           await page.goto('/dashboard');
  372 |         }
  373 |       }
  374 |       
  375 |       // Verify dark theme on mobile
  376 |       const hasDarkClass = await page.evaluate(() => 
  377 |         document.documentElement.classList.contains('dark')
  378 |       );
  379 |       expect(hasDarkClass).toBe(true);
  380 |       
  381 |       // Take mobile screenshot
  382 |       await page.screenshot({ 
  383 |         path: 'test-results/admin-theme-mobile-dark-dashboard.png',
  384 |         fullPage: true 
  385 |       });
  386 |       
  387 |       // Verify mobile menu button is visible
  388 |       const menuButton = page.locator('button[class*="menu"], button[aria-label*="menu"]').first();
  389 |       await expect(menuButton).toBeVisible();
  390 |     });
  391 |   });
  392 | 
  393 |   test.describe('TEST 10: Theme Toggle UI', () => {
  394 |     test('Theme toggle is present in header', async ({ page }) => {
  395 |       await page.goto('/dashboard');
  396 |       await page.waitForLoadState('networkidle');
  397 |       
  398 |       // Handle login
  399 |       if (page.url().includes('/login')) {
  400 |         const emailInput = page.locator('input[type="email"]').first();
  401 |         if (await emailInput.isVisible().catch(() => false)) {
  402 |           await emailInput.fill('admin@amoha.com');
  403 |           await page.locator('input[type="password"]').first().fill('password');
  404 |           await page.locator('button[type="submit"]').first().click();
  405 |           await page.waitForLoadState('networkidle');
  406 |           await page.goto('/dashboard');
  407 |         }
  408 |       }
  409 |       
  410 |       // Look for theme toggle
  411 |       const themeToggle = page.locator('[aria-label*="theme" i], button[class*="theme"]').first();
> 412 |       await expect(themeToggle).toBeVisible();
      |                                 ^ Error: expect(locator).toBeVisible() failed
  413 |     });
  414 |   });
  415 | });
  416 | 
```