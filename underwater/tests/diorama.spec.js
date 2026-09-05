import { test, expect } from '@playwright/test';

async function loadWorld(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__diorama?.ready);
  await expect(page.locator('#loading')).toHaveClass('loading loaded');
  await expect(page.locator('#loading')).not.toBeVisible();
}

test('renders a complete local scene without runtime errors or external requests', async ({ page }) => {
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4193') && !request.url().startsWith('data:')) external.push(request.url()); });
  await loadWorld(page);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('h1')).toContainText('The sunkengarden.');
  const stats = await page.evaluate(() => window.__diorama.stats);
  expect(stats.fish).toBe(14);
  expect(stats.triangles).toBeGreaterThan(50000);
  expect(stats.calls).toBeLessThan(100);
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('pauses all underwater motion and resumes it', async ({ page }) => {
  await loadWorld(page);
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#play-icon')).toBeVisible();
  await expect(page.locator('#pause-icon')).not.toBeVisible();
  const pausedAt = await page.evaluate(() => window.__diorama.time);
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.__diorama.time)).toBe(pausedAt);
  await page.getByRole('button', { name: 'Resume animation' }).click();
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__diorama.time)).toBeGreaterThan(pausedAt);
});

test('field guide, treasure, all entries, and discovery markers work', async ({ page }) => {
  await loadWorld(page);
  await page.getByRole('button', { name: 'Discover the forgotten treasure' }).click();
  await expect(page.locator('#field-guide')).toBeVisible();
  await page.getByRole('button', { name: 'Open the chest' }).click();
  expect(await page.evaluate(() => window.__diorama.chestOpen)).toBe(true);
  await expect(page.locator('#guide-action')).toContainText('Close the chest');
  await page.getByRole('button', { name: 'Close the chest' }).click();
  expect(await page.evaluate(() => window.__diorama.chestOpen)).toBe(false);
  await page.getByRole('button', { name: 'Read about the ruins' }).click();
  await expect(page.locator('#guide-title')).toHaveText('Echoes of a city');
  await page.getByRole('button', { name: 'Read about the reef' }).click();
  await expect(page.locator('#guide-title')).toHaveText('Life finds a way');
  await page.getByRole('button', { name: 'Take a quiet moment' }).click();
  await expect(page.locator('#field-guide')).not.toBeVisible();
  await page.locator('#details-toggle').click();
  await expect(page.locator('#hotspots')).not.toBeVisible();
  await page.locator('#details-toggle').click();
  await expect(page.locator('#hotspots')).toBeVisible();
  await page.locator('#guide-toggle').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#field-guide')).not.toBeVisible();
  await expect(page.locator('#guide-toggle')).toBeFocused();
});

test('drag, zoom, automatic orbit, and reset change and restore the camera', async ({ page }) => {
  await loadWorld(page);
  const initial = await page.evaluate(() => window.__diorama.camera);
  await page.mouse.move(800, 530);
  await page.mouse.down();
  await page.mouse.move(1010, 560, { steps: 16 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__diorama.camera)).not.toEqual(initial);
  await page.mouse.wheel(0, -250);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__diorama.zoom)).toBeGreaterThan(1);
  await page.locator('#rotate-toggle').click();
  await expect(page.locator('#rotate-toggle')).toHaveAttribute('aria-pressed', 'true');
  const beforeOrbit = await page.evaluate(() => window.__diorama.camera);
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.__diorama.camera)).not.toEqual(beforeOrbit);
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.waitForTimeout(1400);
  const reset = await page.evaluate(() => ({ camera: window.__diorama.camera, zoom: window.__diorama.zoom, orbit: window.__diorama.orbit }));
  expect(reset.zoom).toBeCloseTo(1, 3);
  reset.camera.forEach((value, index) => expect(value).toBeCloseTo(initial[index], 1));
  expect(reset.orbit).toBe(false);
});

test('mobile layout fits, the guide opens, and controls remain reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await loadWorld(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const bounds = await page.locator('.scene-controls').boundingBox();
  expect(bounds.x).toBeGreaterThan(0);
  expect(bounds.x + bounds.width).toBeLessThan(390);
  expect(bounds.y + bounds.height).toBeLessThan(844);
  await page.locator('#guide-toggle').click();
  await expect(page.locator('#field-guide')).toBeVisible();
  const guide = await page.locator('#field-guide').boundingBox();
  expect(guide.x + guide.width).toBeLessThan(390);
  await page.locator('#guide-close').click();
  await page.locator('#motion-toggle').click();
  expect(await page.evaluate(() => window.__diorama.paused)).toBe(true);
  await page.screenshot({ path: 'screenshots/mobile-tested.png' });
});

test('honors reduced motion and still lets the visitor open the chest', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadWorld(page);
  expect(await page.evaluate(() => window.__diorama.paused)).toBe(true);
  expect(await page.evaluate(() => window.__diorama.time)).toBe(0);
  await page.locator('#guide-toggle').click();
  await page.getByRole('button', { name: 'Open the chest' }).click();
  expect(await page.evaluate(() => window.__diorama.chestOpen)).toBe(true);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'screenshots/treasure-open.png' });
});
