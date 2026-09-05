import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

async function openIsland(page) {
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle('Offshore — A little paradise');
  await page.waitForFunction(() => !!window.__island);
  await expect(page.locator('#loading')).toHaveCount(0);
  return errors;
}

test('renders, animates, orbits, changes light, resets, and exports a postcard', async ({ page }) => {
  const errors = await openIsland(page);
  await fs.mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/daylight.png' });
  expect(await page.evaluate(() => __island.renderer.info.memory.geometries)).toBeGreaterThan(100);

  await page.locator('#motion-toggle').click();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'false');
  const paused = await page.evaluate(() => __island.time);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => __island.time)).toBe(paused);
  await page.locator('#scene').focus();
  await page.keyboard.press('Space');
  expect(await page.evaluate(() => __island.playing)).toBe(true);

  const angle = await page.evaluate(() => __island.controls.getAzimuthalAngle());
  await page.locator('#rotate-toggle').click();
  await expect(page.locator('#rotate-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.waitForFunction(before => Math.abs(__island.controls.getAzimuthalAngle() - before) > .005, angle);
  await page.locator('#reset').click();
  await expect(page.locator('#rotate-toggle')).toHaveAttribute('aria-pressed', 'false');
  await page.waitForFunction(() => __island.camera.position.distanceTo({ x: 10, y: 17.5, z: 18.5 }) < .05);

  await page.locator('#info-toggle').click();
  await expect(page.locator('#about')).toBeVisible();
  await page.locator('#info-toggle').click();
  await expect(page.locator('#about')).toBeHidden();

  await page.locator('#light-toggle').click();
  await expect(page.locator('#light-label')).toHaveText('Golden hour');
  await expect(page.locator('body')).toHaveClass('golden');
  await page.waitForFunction(() => __island.scene.children.find(o => o.isDirectionalLight && o.castShadow).position.y < 10);
  await page.screenshot({ path: 'artifacts/golden-hour.png' });
  const downloaded = page.waitForEvent('download');
  await page.locator('#capture').click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe('offshore-golden-hour.png');
  await download.saveAs('artifacts/postcard.png');
  const png = await fs.readFile('artifacts/postcard.png');
  expect(png.subarray(1, 4).toString()).toBe('PNG');
  expect(png.length).toBeGreaterThan(100_000);

  // Mouse orbit and wheel zoom are real camera operations, not decorative controls.
  await page.mouse.move(820, 470); await page.mouse.down(); await page.mouse.move(930, 485, { steps: 8 }); await page.mouse.up();
  await page.mouse.wheel(0, -180);
  await page.waitForFunction(() => __island.camera.zoom > 1.01);
  expect(errors).toEqual([]);
});

test('fits a phone and respects reduced motion, with no external runtime requests', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:43871', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const external = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:43871') && !request.url().startsWith('data:')) external.push(request.url()); });
  const errors = await openIsland(page);
  expect(await page.evaluate(() => __island.playing)).toBe(false);
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'false');
  const rect = await page.locator('.controls').boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.x + rect.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'artifacts/mobile.png' });
  await page.locator('#light-toggle').tap();
  await expect(page.locator('#light-label')).toHaveText('Golden hour');
  const goldenRect = await page.locator('.controls').boundingBox();
  expect(goldenRect.x + goldenRect.width).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]); expect(external).toEqual([]);
  await context.close();
});
