import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const url = process.env.TEST_URL || "http://127.0.0.1:4310";
await mkdir("screenshots", { recursive: true });

function collectErrors(page) {
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 1,
  });
  collectErrors(page);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__porto?.ready, { timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "screenshots/daylight.png" });
  const home = await page.evaluate(() => __porto.camera.position.toArray());

  await page.getByRole("button", { name: "Golden hour", exact: true }).click();
  await page.waitForFunction(() => __porto.lighting > 0.98);
  assert.equal(
    await page.locator("#golden").getAttribute("aria-pressed"),
    "true",
  );
  await page.screenshot({ path: "screenshots/golden-hour.png" });

  await page.getByRole("button", { name: "Night", exact: true }).click();
  await page.waitForFunction(
    () => __porto.night > 0.995 && __porto.lighting < 0.005,
  );
  assert.equal(
    await page.locator("#night").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), "night");
  assert.equal(
    await page.locator('.time-switch [aria-pressed="true"]').count(),
    1,
  );
  assert.equal(await page.evaluate(() => __porto.lightingMode), "night");
  assert.ok(
    await page.evaluate(() => {
      let glowing = false;
      __porto.scene.traverse((object) => {
        if (object.material?.name === "dark glass")
          glowing ||= object.material.emissiveIntensity > 1;
      });
      return glowing;
    }),
    "Night must illuminate the windows",
  );
  await page.screenshot({ path: "screenshots/night.png" });

  await page.getByRole("button", { name: "Toggle automatic rotation" }).click();
  assert.equal(
    await page.locator("#rotate").getAttribute("aria-pressed"),
    "true",
  );
  await page.waitForTimeout(600);
  const orbited = await page.evaluate(() => __porto.camera.position.toArray());
  assert.ok(
    Math.abs(orbited[0] - home[0]) > 0.01,
    "Automatic rotation must move the camera",
  );

  await page.mouse.move(950, 470);
  await page.mouse.down();
  await page.mouse.move(660, 480, { steps: 16 });
  await page.mouse.up();
  assert.equal(
    await page.locator("#rotate").getAttribute("aria-pressed"),
    "false",
  );
  await page.mouse.wheel(0, -300);
  await page.waitForFunction(() => __porto.camera.zoom > 1.05);

  await page.getByRole("button", { name: "Reset camera" }).click();
  await page.waitForFunction(
    ([x, y, z]) =>
      Math.hypot(
        __porto.camera.position.x - x,
        __porto.camera.position.y - y,
        __porto.camera.position.z - z,
      ) < 0.05 && Math.abs(__porto.camera.zoom - 1) < 0.005,
    home,
  );
  await page.getByRole("button", { name: "Toggle harbor ambience" }).click();
  assert.equal(
    await page.locator("#sound").getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Toggle harbor ambience" }).click();
  assert.equal(
    await page.locator("#sound").getAttribute("aria-pressed"),
    "false",
  );

  await page.getByRole("button", { name: "About this little world" }).click();
  assert.ok(await page.locator("dialog").isVisible());
  const reference = await page.request.get(
    new URL(await page.locator("#reference").getAttribute("href"), page.url())
      .href,
  );
  assert.equal(
    reference.status(),
    200,
    "The reference image must also be included in production",
  );
  assert.match(reference.headers()["content-type"], /image\/png/);
  await page.keyboard.press("Escape");
  assert.ok(!(await page.locator("dialog").isVisible()));
  await page.getByRole("button", { name: "Daylight", exact: true }).click();
  await page.waitForFunction(
    () => __porto.lighting < 0.005 && __porto.night < 0.005,
  );
  assert.equal(await page.locator("html").getAttribute("data-theme"), "day");
  assert.ok(
    await page.evaluate(() => {
      let restored = true;
      __porto.scene.traverse((object) => {
        if (object.material?.name === "dark glass")
          restored &&= object.material.emissiveIntensity < 0.01;
        if (object.isPointLight && object.userData.nightIntensity)
          restored &&= object.intensity < 0.1;
      });
      return restored;
    }),
    "Daylight must switch off the night lights",
  );

  await page.setViewportSize({ width: 1536, height: 960 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "screenshots/widescreen.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: "screenshots/mobile.png" });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    390,
  );

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  collectErrors(mobile);
  await mobile.goto(url, { waitUntil: "networkidle" });
  await mobile.waitForFunction(() => window.__porto?.ready);
  await mobile.waitForTimeout(600);
  await mobile.screenshot({ path: "screenshots/mobile-retina.png" });
  assert.equal(
    await mobile.evaluate(() => __porto.renderer.getPixelRatio()),
    2,
  );

  // Icon-only controls remain named and keyboard-accessible on narrow screens.
  await mobile.getByRole("button", { name: "Night", exact: true }).tap();
  await mobile.waitForFunction(() => __porto.night === 1);
  await mobile.screenshot({ path: "screenshots/night-mobile.png" });
  await mobile.setViewportSize({ width: 320, height: 740 });
  assert.ok(
    await mobile.evaluate(() => {
      const brand = document.querySelector(".brand").getBoundingClientRect();
      const switcher = document
        .querySelector(".time-switch")
        .getBoundingClientRect();
      return brand.right <= switcher.left && switcher.right <= innerWidth;
    }),
    "The three lighting controls must not overlap the brand on small phones",
  );
  await mobile
    .getByRole("button", { name: "Golden hour", exact: true })
    .focus();
  await mobile.keyboard.press("Enter");
  await mobile.waitForFunction(
    () => __porto.night === 0 && __porto.lighting === 1,
  );
  await mobile.getByRole("button", { name: "Daylight", exact: true }).tap();
  await mobile.waitForFunction(
    () => __porto.night === 0 && __porto.lighting === 0,
  );

  assert.deepEqual(errors, [], "No browser or shader errors");
  console.log(
    "Passed: rendering, day/golden/night transitions and restoration, orbit, drag, zoom, reset, audio, dialog, reference asset, responsive resize, accessible mobile lighting controls, and reduced motion.",
  );
} finally {
  await browser.close();
}
