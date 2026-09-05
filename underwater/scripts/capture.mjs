import { chromium } from '@playwright/test';

// Run from the project root, with `pnpm dev` running in another terminal.
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', error => console.error(error));
  await page.goto('http://127.0.0.1:5193');
  await page.waitForFunction(() => window.__diorama?.ready, null, { timeout: 60000 });
  await page.locator('#loading').waitFor({ state: 'hidden' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'screenshots/desktop.png' });
  console.log('Scene:', await page.evaluate(() => window.__diorama.stats));

  // Verify direct 3D picking as well as the guide-based interaction in the test suite.
  const marker = await page.locator('[data-feature="treasure"]').boundingBox();
  await page.mouse.click(marker.x + marker.width / 2, marker.y + marker.height / 2 + 43);
  console.log('Direct chest click:', await page.evaluate(() => window.__diorama.chestOpen));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'screenshots/mobile.png' });
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'screenshots/mobile-small.png' });
} finally {
  await browser.close();
}
