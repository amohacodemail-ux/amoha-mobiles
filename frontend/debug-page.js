const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleLogs = [];
  page.on('console', m => consoleLogs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', e => consoleLogs.push('PAGE_ERROR: ' + e.message));
  await page.goto('http://localhost:3002', { waitUntil: 'load' });
  await page.waitForTimeout(10000);
  const body = await page.evaluate(() => document.body.innerHTML.substring(0, 4000));
  const title = await page.title();
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: false });
  await browser.close();
  console.log('TITLE:', title);
  console.log('LOGS:', consoleLogs.slice(0, 20).join('\n'));
  console.log('BODY_PREVIEW:', body.substring(0, 2000));
})().catch(e => console.error('ERROR:', e.message));
