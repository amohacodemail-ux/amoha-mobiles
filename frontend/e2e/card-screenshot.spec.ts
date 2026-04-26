import { test, expect } from '@playwright/test';

test('card heights diagnostic – measure and screenshot all sections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('a.group', { timeout: 15000 });

  // Scroll to Featured Deals
  const featured = page.getByText('Featured Deals').first();
  await featured.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/diag-featured-mobile.png' });

  // Measure card heights in Featured Deals section
  const featuredHeights = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('h2'));
    const featuredHeader = sections.find(h => h.textContent?.includes('Featured Deals'));
    if (!featuredHeader) return { error: 'no Featured Deals header' };
    const section = featuredHeader.closest('section') || featuredHeader.parentElement?.parentElement?.parentElement;
    const cards = section?.querySelectorAll('a.group');
    if (!cards) return { error: 'no cards' };
    return {
      count: cards.length,
      heights: Array.from(cards).slice(0, 4).map((c, i) => ({
        i,
        outerH: c.getBoundingClientRect().height,
        name: (c.querySelector('h3') as HTMLElement)?.offsetHeight,
        nameText: (c.querySelector('h3') as HTMLElement)?.textContent?.trim().slice(0, 30),
        specsH: (c.querySelectorAll('div')[c.querySelectorAll('div').length - 3] as HTMLElement)?.offsetHeight,
        innerCardH: (c.querySelector('div') as HTMLElement)?.getBoundingClientRect().height,
      }))
    };
  });
  console.log('FEATURED:', JSON.stringify(featuredHeights, null, 2));

  // Scroll to Trending Now
  const trending = page.getByText('Trending Now').first();
  await trending.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/diag-trending-mobile.png' });

  const trendingHeights = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('h2'));
    const trendingHeader = sections.find(h => h.textContent?.includes('Trending Now'));
    if (!trendingHeader) return { error: 'no Trending Now header' };
    const section = trendingHeader.closest('section') || trendingHeader.parentElement?.parentElement?.parentElement;
    const cards = section?.querySelectorAll('a.group');
    if (!cards) return { error: 'no cards' };
    return {
      count: cards.length,
      heights: Array.from(cards).slice(0, 4).map((c, i) => {
        const h3 = c.querySelector('h3') as HTMLElement;
        const allDivs = c.querySelectorAll('div');
        return {
          i,
          outerH: Math.round(c.getBoundingClientRect().height),
          innerCardH: Math.round((allDivs[0] as HTMLElement)?.getBoundingClientRect().height),
          nameText: h3?.textContent?.trim().slice(0, 30),
          nameH: h3?.offsetHeight,
          nameComputedMinH: h3 ? window.getComputedStyle(h3).minHeight : null,
          nameLineClamp: h3 ? window.getComputedStyle(h3).webkitLineClamp : null,
        };
      })
    };
  });
  console.log('TRENDING:', JSON.stringify(trendingHeights, null, 2));

  // Desktop screenshot at 1280
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForSelector('a.group', { timeout: 15000 });
  const featuredDesktop = page.getByText('Featured Deals').first();
  await featuredDesktop.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/diag-featured-desktop.png' });
});
