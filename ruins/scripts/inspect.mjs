import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--enable-webgl', '--ignore-gpu-blocklist', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.DIORAMA_URL || 'http://127.0.0.1:4186');
  await page.waitForFunction(() => window.__DIORAMA_READY__, null, { timeout: 120_000 });
  await page.locator('#loading').waitFor({ state: 'detached' });
  await page.screenshot({ path: 'artifacts/daylight.png' });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Scene loaded without runtime errors. Screenshot: artifacts/daylight.png');
} finally {
  await browser.close();
}
