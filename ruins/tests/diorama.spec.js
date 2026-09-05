import { test, expect } from '@playwright/test';

async function load(page) {
  await page.goto('/');
  await page.waitForFunction(() => window.__DIORAMA_READY__, null, { timeout: 90_000 });
  await page.locator('#loading').waitFor({ state: 'detached', timeout: 30_000 });
}

test('renders a complete, interactive diorama without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await load(page);
  await expect(page).toHaveTitle('The Forgotten Gate — A living diorama');
  await expect(page.locator('canvas')).toHaveCount(1);
  const counts = await page.evaluate(() => {
    let instances = 0, triangles = 0;
    window.__diorama.scene.traverse(o => {
      if (!o.isMesh) return;
      const count = o.isInstancedMesh ? o.count : 1;
      instances += count;
      triangles += (o.geometry.index?.count || o.geometry.attributes.position.count) / 3 * count;
    });
    return { instances, triangles };
  });
  expect(counts.instances).toBeGreaterThan(10_000);
  expect(counts.triangles).toBeGreaterThan(100_000);
  await page.screenshot({ path: 'artifacts/daylight.png' });

  await page.locator('#story-toggle').click();
  await expect(page.locator('#story')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#story')).toBeHidden();

  const start = await page.evaluate(() => window.__diorama.camera.position.toArray());
  await page.mouse.move(940, 540);
  await page.mouse.down();
  await page.mouse.move(1100, 550, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const rotated = await page.evaluate(() => window.__diorama.camera.position.toArray());
  expect(rotated).not.toEqual(start);
  await page.mouse.wheel(0, -240);
  await expect.poll(() => page.evaluate(() => window.__diorama.camera.zoom)).toBeGreaterThan(1);
  await page.locator('#rotate-toggle').click();
  await expect(page.locator('#rotate-toggle')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#reset-view').click();
  await expect.poll(() => page.evaluate(() => Math.abs(window.__diorama.camera.zoom - 1))).toBeLessThan(.002);
  await expect(page.locator('#rotate-toggle')).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
  console.log(`Scene: ${counts.instances.toLocaleString()} instances, ${Math.round(counts.triangles).toLocaleString()} triangles.`);
});

test('dusk lighting and postcard download work', async ({ page }) => {
  await load(page);
  await page.locator('#light-toggle').click();
  await expect(page.locator('body')).toHaveClass('dusk');
  await expect(page.locator('#light-label')).toHaveText('Dusk');
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'artifacts/dusk.png' });
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#capture').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('the-forgotten-gate-dusk.png');
  await download.saveAs('artifacts/postcard.png');
  await page.locator('#light-toggle').click();
  await expect(page.locator('#light-label')).toHaveText('Daylight');
});

test('mobile layout and reduced-motion controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({ path: 'artifacts/mobile.png' });
  for (const id of ['rotate-toggle', 'light-toggle', 'reset-view', 'capture']) {
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.y + box.height).toBeLessThanOrEqual(844);
  }
  await page.locator('canvas').focus();
  await page.keyboard.press('+');
  expect(await page.evaluate(() => window.__diorama.camera.zoom)).toBeGreaterThan(1);
  await page.keyboard.press('Home');
  expect(await page.evaluate(() => window.__diorama.camera.zoom)).toBe(1);
});
