# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme-audit.spec.ts >> Admin Theme System Validation >> TEST 5: Admin Header Theme >> Header renders correctly in both themes
- Location: e2e\theme-audit.spec.ts:206:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('header').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('header').first()

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
  128 |   });
  129 | 
  130 |   test.describe('TEST 3: Theme Persistence on Refresh', () => {
  131 |     test('Dark theme persists after page refresh', async ({ page }) => {
  132 |       await setTheme(page, 'dark');
  133 |       await page.goto('/dashboard');
  134 |       await page.waitForLoadState('networkidle');
  135 |       
  136 |       // Handle login
  137 |       if (page.url().includes('/login')) {
  138 |         const emailInput = page.locator('input[type="email"]').first();
  139 |         if (await emailInput.isVisible().catch(() => false)) {
  140 |           await emailInput.fill('admin@amoha.com');
  141 |           await page.locator('input[type="password"]').first().fill('password');
  142 |           await page.locator('button[type="submit"]').first().click();
  143 |           await page.waitForLoadState('networkidle');
  144 |           await page.goto('/dashboard');
  145 |         }
  146 |       }
  147 |       
  148 |       // Verify dark
  149 |       let hasDarkClass = await page.evaluate(() => 
  150 |         document.documentElement.classList.contains('dark')
  151 |       );
  152 |       expect(hasDarkClass).toBe(true);
  153 |       
  154 |       // Refresh
  155 |       await page.reload();
  156 |       await page.waitForLoadState('networkidle');
  157 |       
  158 |       // Verify persisted
  159 |       hasDarkClass = await page.evaluate(() => 
  160 |         document.documentElement.classList.contains('dark')
  161 |       );
  162 |       expect(hasDarkClass).toBe(true);
  163 |     });
  164 |   });
  165 | 
  166 |   test.describe('TEST 4: Admin Sidebar Theme', () => {
  167 |     test('Sidebar renders correctly in both themes', async ({ page }) => {
  168 |       await page.goto('/dashboard');
  169 |       await page.waitForLoadState('networkidle');
  170 |       
  171 |       // Handle login
  172 |       if (page.url().includes('/login')) {
  173 |         const emailInput = page.locator('input[type="email"]').first();
  174 |         if (await emailInput.isVisible().catch(() => false)) {
  175 |           await emailInput.fill('admin@amoha.com');
  176 |           await page.locator('input[type="password"]').first().fill('password');
  177 |           await page.locator('button[type="submit"]').first().click();
  178 |           await page.waitForLoadState('networkidle');
  179 |           await page.goto('/dashboard');
  180 |         }
  181 |       }
  182 |       
  183 |       for (const theme of ['light', 'dark'] as const) {
  184 |         await setTheme(page, theme);
  185 |         await page.waitForTimeout(100);
  186 |         
  187 |         // Find sidebar
  188 |         const sidebar = page.locator('aside, [class*="sidebar"], nav').first();
  189 |         await expect(sidebar).toBeVisible();
  190 |         
  191 |         // Verify sidebar has background
  192 |         const bgColor = await sidebar.evaluate((el) => 
  193 |           window.getComputedStyle(el).backgroundColor
  194 |         );
  195 |         expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  196 |         expect(bgColor).not.toBe('transparent');
  197 |         
  198 |         // Verify nav items are visible
  199 |         const navItems = sidebar.locator('a, button').first();
  200 |         await expect(navItems).toBeVisible();
  201 |       }
  202 |     });
  203 |   });
  204 | 
  205 |   test.describe('TEST 5: Admin Header Theme', () => {
  206 |     test('Header renders correctly in both themes', async ({ page }) => {
  207 |       await page.goto('/dashboard');
  208 |       await page.waitForLoadState('networkidle');
  209 |       
  210 |       // Handle login
  211 |       if (page.url().includes('/login')) {
  212 |         const emailInput = page.locator('input[type="email"]').first();
  213 |         if (await emailInput.isVisible().catch(() => false)) {
  214 |           await emailInput.fill('admin@amoha.com');
  215 |           await page.locator('input[type="password"]').first().fill('password');
  216 |           await page.locator('button[type="submit"]').first().click();
  217 |           await page.waitForLoadState('networkidle');
  218 |           await page.goto('/dashboard');
  219 |         }
  220 |       }
  221 |       
  222 |       for (const theme of ['light', 'dark'] as const) {
  223 |         await setTheme(page, theme);
  224 |         await page.waitForTimeout(100);
  225 |         
  226 |         // Find header
  227 |         const header = page.locator('header').first();
> 228 |         await expect(header).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  229 |         
  230 |         // Verify header content
  231 |         const headerText = header.locator('text=/./').first();
  232 |         await expect(headerText).toBeVisible();
  233 |       }
  234 |     });
  235 |   });
  236 | 
  237 |   test.describe('TEST 6: Data Table Theme', () => {
  238 |     test('Data tables render correctly in both themes', async ({ page }) => {
  239 |       await page.goto('/products');
  240 |       await page.waitForLoadState('networkidle');
  241 |       
  242 |       // Handle login
  243 |       if (page.url().includes('/login')) {
  244 |         const emailInput = page.locator('input[type="email"]').first();
  245 |         if (await emailInput.isVisible().catch(() => false)) {
  246 |           await emailInput.fill('admin@amoha.com');
  247 |           await page.locator('input[type="password"]').first().fill('password');
  248 |           await page.locator('button[type="submit"]').first().click();
  249 |           await page.waitForLoadState('networkidle');
  250 |           await page.goto('/products');
  251 |         }
  252 |       }
  253 |       
  254 |       for (const theme of ['light', 'dark'] as const) {
  255 |         await setTheme(page, theme);
  256 |         await page.waitForTimeout(100);
  257 |         
  258 |         // Find table
  259 |         const table = page.locator('table').first();
  260 |         if (await table.isVisible().catch(() => false)) {
  261 |           await expect(table).toBeVisible();
  262 |           
  263 |           // Verify table has proper background
  264 |           const bgColor = await table.evaluate((el) => 
  265 |             window.getComputedStyle(el).backgroundColor
  266 |           );
  267 |           expect(bgColor).not.toBe('transparent');
  268 |         }
  269 |       }
  270 |     });
  271 |   });
  272 | 
  273 |   test.describe('TEST 7: Card Components Theme', () => {
  274 |     test('Cards render correctly in both themes', async ({ page }) => {
  275 |       await page.goto('/dashboard');
  276 |       await page.waitForLoadState('networkidle');
  277 |       
  278 |       // Handle login
  279 |       if (page.url().includes('/login')) {
  280 |         const emailInput = page.locator('input[type="email"]').first();
  281 |         if (await emailInput.isVisible().catch(() => false)) {
  282 |           await emailInput.fill('admin@amoha.com');
  283 |           await page.locator('input[type="password"]').first().fill('password');
  284 |           await page.locator('button[type="submit"]').first().click();
  285 |           await page.waitForLoadState('networkidle');
  286 |           await page.goto('/dashboard');
  287 |         }
  288 |       }
  289 |       
  290 |       for (const theme of ['light', 'dark'] as const) {
  291 |         await setTheme(page, theme);
  292 |         await page.waitForTimeout(100);
  293 |         
  294 |         // Find cards
  295 |         const cards = page.locator('[class*="card"]').first();
  296 |         if (await cards.isVisible().catch(() => false)) {
  297 |           await expect(cards).toBeVisible();
  298 |           
  299 |           // Verify card has background
  300 |           const bgColor = await cards.evaluate((el) => 
  301 |             window.getComputedStyle(el).backgroundColor
  302 |           );
  303 |           expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
  304 |         }
  305 |       }
  306 |     });
  307 |   });
  308 | 
  309 |   test.describe('TEST 8: No Console Theme Errors', () => {
  310 |     test('No theme-related errors in console', async ({ page }) => {
  311 |       const errors: string[] = [];
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
```