import { test, expect } from '@playwright/test';

const scenes = [
  { slug: 'italy-town', title: /Porto piccolo/, ready: () => window.__porto?.ready },
  { slug: 'asia', title: /Komorebi/, ready: () => window.__garden?.ready },
  { slug: 'island', title: /Offshore/, ready: () => window.__island?.renderer.info.render.frame > 2 },
  { slug: 'night-street', title: /Ame Yokochō/, ready: () => window.__DIORAMA_READY__ },
  { slug: 'ruins', title: /The Forgotten Gate/, ready: () => window.__DIORAMA_READY__ },
  { slug: 'underwater', title: /Thalassa/, ready: () => window.__diorama?.ready },
];

for (const width of [1440, 390]) {
  test(`gallery links and previews work at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(baseURL);
    await expect(page).toHaveTitle('Small worlds — Stylized dioramas');
    await expect(page.locator('.card')).toHaveCount(6);
    const fontsLoaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('16px "DM Sans"') && document.fonts.check('16px Italiana');
    });
    expect(fontsLoaded).toBe(true);
    for (const { slug } of scenes) {
      const card = page.locator(`.card[href="./${slug}/"]`);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      await expect.poll(() => card.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await card.evaluate(link => link.href)).toBe(new URL(`${slug}/`, baseURL).href);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  });
}

for (const scene of scenes) {
  test(`${scene.slug} renders at its direct URL and returns to the gallery`, async ({ page, baseURL }) => {
    const errors = [];
    const localFailures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith(new URL(baseURL).origin) && response.status() >= 400) {
        localFailures.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on('requestfailed', request => {
      if (request.url().startsWith(new URL(baseURL).origin)) localFailures.push(request.url());
    });
    const response = await page.goto(new URL(`${scene.slug}/`, baseURL).href);
    expect(response.status()).toBe(200);
    await expect(page).toHaveTitle(scene.title);
    expect(localFailures).toEqual([]);
    await page.waitForFunction(scene.ready, null, { timeout: 120_000 });
    await expect(page.locator('canvas').first()).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(errors).toEqual([]);
    expect(localFailures).toEqual([]);
    await page.getByRole('link', { name: 'All dioramas', exact: true }).click();
    await expect(page).toHaveURL(baseURL);
    await expect(page.locator('.card')).toHaveCount(6);
  });
}
