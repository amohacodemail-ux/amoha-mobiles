# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: theme-audit.spec.ts >> Admin Theme System Validation >> TEST 2: Dark → Light Theme Switch >> Login page - Dark to Light switch
- Location: e2e\theme-audit.spec.ts:91:11

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main, [role="main"], .flex-1').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('main, [role="main"], .flex-1').first()

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
  25  | 
  26  | /**
  27  |  * Helper to toggle theme via classList manipulation (avoids localStorage security issues in tests)
  28  |  */
  29  | async function setTheme(page: Page, theme: 'light' | 'dark') {
  30  |   await page.evaluate((t) => {
  31  |     const html = document.documentElement;
  32  |     html.classList.remove('light', 'dark');
  33  |     html.classList.add(t);
  34  |     html.style.colorScheme = t;
  35  |   }, theme);
  36  |   await page.waitForTimeout(150);
  37  | }
  38  | 
  39  | test.describe('Admin Theme System Validation', () => {
  40  |   
  41  |   test.describe('TEST 1: Light → Dark Theme Switch', () => {
  42  |     for (const page of ADMIN_PAGES) {
  43  |       test(`${page.name} page - Light to Dark switch`, async ({ page: pwPage }) => {
  44  |         await setTheme(pwPage, 'light');
  45  |         await pwPage.goto(page.path);
  46  |         await pwPage.waitForLoadState('networkidle');
  47  |         
  48  |         // Handle login redirect if needed
  49  |         if (pwPage.url().includes('/login')) {
  50  |           // Fill in test credentials if on login page
  51  |           const emailInput = pwPage.locator('input[type="email"]').first();
  52  |           if (await emailInput.isVisible().catch(() => false)) {
  53  |             await emailInput.fill('admin@amoha.com');
  54  |             await pwPage.locator('input[type="password"]').first().fill('password');
  55  |             await pwPage.locator('button[type="submit"]').first().click();
  56  |             await pwPage.waitForLoadState('networkidle');
  57  |             await pwPage.goto(page.path);
  58  |           }
  59  |         }
  60  |         
  61  |         // Verify light theme
  62  |         const hasLightClass = await pwPage.evaluate(() => 
  63  |           document.documentElement.classList.contains('light')
  64  |         );
  65  |         expect(hasLightClass).toBe(true);
  66  |         
  67  |         // Switch to dark
  68  |         await setTheme(pwPage, 'dark');
  69  |         
  70  |         // Verify dark theme
  71  |         const hasDarkClass = await pwPage.evaluate(() => 
  72  |           document.documentElement.classList.contains('dark')
  73  |         );
  74  |         expect(hasDarkClass).toBe(true);
  75  |         
  76  |         // Screenshot for validation
  77  |         await pwPage.screenshot({ 
  78  |           path: `test-results/admin-theme-dark-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
  79  |           fullPage: true 
  80  |         });
  81  |         
  82  |         // Verify content
  83  |         const mainContent = pwPage.locator('main, [role="main"], .flex-1').first();
  84  |         await expect(mainContent).toBeVisible();
  85  |       });
  86  |     }
  87  |   });
  88  | 
  89  |   test.describe('TEST 2: Dark → Light Theme Switch', () => {
  90  |     for (const page of ADMIN_PAGES) {
  91  |       test(`${page.name} page - Dark to Light switch`, async ({ page: pwPage }) => {
  92  |         await setTheme(pwPage, 'dark');
  93  |         await pwPage.goto(page.path);
  94  |         await pwPage.waitForLoadState('networkidle');
  95  |         
  96  |         // Handle login redirect
  97  |         if (pwPage.url().includes('/login')) {
  98  |           const emailInput = pwPage.locator('input[type="email"]').first();
  99  |           if (await emailInput.isVisible().catch(() => false)) {
  100 |             await emailInput.fill('admin@amoha.com');
  101 |             await pwPage.locator('input[type="password"]').first().fill('password');
  102 |             await pwPage.locator('button[type="submit"]').first().click();
  103 |             await pwPage.waitForLoadState('networkidle');
  104 |             await pwPage.goto(page.path);
  105 |           }
  106 |         }
  107 |         
  108 |         // Switch to light
  109 |         await setTheme(pwPage, 'light');
  110 |         
  111 |         // Verify light theme
  112 |         const hasLightClass = await pwPage.evaluate(() => 
  113 |           document.documentElement.classList.contains('light')
  114 |         );
  115 |         expect(hasLightClass).toBe(true);
  116 |         
  117 |         // Screenshot
  118 |         await pwPage.screenshot({ 
  119 |           path: `test-results/admin-theme-light-${page.name.toLowerCase().replace(/\s+/g, '-')}.png`,
  120 |           fullPage: true 
  121 |         });
  122 |         
  123 |         // Verify content
  124 |         const mainContent = pwPage.locator('main, [role="main"], .flex-1').first();
> 125 |         await expect(mainContent).toBeVisible();
      |                                   ^ Error: expect(locator).toBeVisible() failed
  126 |       });
  127 |     }
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
```