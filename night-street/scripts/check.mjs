import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const port = 43129;
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', d => { serverLog += d; }); server.stderr.on('data', d => { serverLog += d; });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw Error(`Test server failed: ${serverLog}`);
    try { ready = (await fetch(url)).ok; } catch { /* starting */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(ready, 'Test server did not start');
  await fs.mkdir('artifacts', { recursive: true });
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1512, height: 982 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__DIORAMA_READY__, null, { timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'artifacts/desktop.png' });
  console.log('Scene:', await page.evaluate(() => ({ meshes: window.__diorama.meshCount, geometry: window.__diorama.renderer.info.memory.geometries, textures: window.__diorama.renderer.info.memory.textures })));

  await page.getByRole('button', { name: 'Rain', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__diorama.rainEnabled), false, 'Rain toggle');
  await page.keyboard.press('r');
  assert.equal(await page.evaluate(() => window.__diorama.rainEnabled), true, 'Rain shortcut');
  await page.getByRole('button', { name: 'Neon', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__diorama.neonEnabled), false, 'Neon toggle');
  await page.waitForTimeout(2400);
  await page.screenshot({ path: 'artifacts/neon-off.png' });
  await page.keyboard.press('l');
  assert.equal(await page.evaluate(() => window.__diorama.neonEnabled), true, 'Neon shortcut');

  const initial = await page.evaluate(() => window.__diorama.camera.position.toArray());
  await page.getByRole('button', { name: 'Orbit', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__diorama.controls.autoRotate), true, 'Auto orbit');
  await page.waitForTimeout(700);
  assert.notDeepEqual(await page.evaluate(() => window.__diorama.camera.position.toArray()), initial, 'Orbit changes camera');
  await page.getByRole('button', { name: 'Reset view' }).click();
  await page.waitForTimeout(1300);
  assert.equal(await page.evaluate(() => window.__diorama.controls.autoRotate), false, 'Reset stops orbit');

  await page.mouse.move(760, 420);
  await page.mouse.wheel(0, -180);
  await page.waitForTimeout(350);
  assert(await page.evaluate(() => window.__diorama.camera.zoom > 1), 'Wheel zoom');
  await page.mouse.down(); await page.mouse.move(900, 450, { steps: 12 }); await page.mouse.up();
  await page.waitForTimeout(500);
  assert.notDeepEqual(await page.evaluate(() => window.__diorama.camera.position.toArray()), initial, 'Drag orbits');
  await page.keyboard.press('0');
  await page.waitForTimeout(1600);
  assert(await page.evaluate(() => Math.abs(window.__diorama.camera.zoom - 1) < .001), 'Reset restores zoom');
  const restored = await page.evaluate(() => window.__diorama.camera.position.toArray());
  assert(restored.every((v, i) => Math.abs(v - initial[i]) < .03), `Reset restores camera: ${restored} vs ${initial}`);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save a postcard' }).click();
  const download = await downloadPromise;
  await download.saveAs('artifacts/postcard.png');
  assert((await fs.stat('artifacts/postcard.png')).size > 100000, 'Postcard is nonempty');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: 'artifacts/mobile.png' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), 'No mobile overflow');
  for (const name of ['Rain', 'Neon', 'Orbit', 'Reset view', 'Save a postcard', 'Enter fullscreen']) {
    assert(await page.getByRole('button', { name, exact: true }).isVisible(), `Mobile control: ${name}`);
  }
  await page.getByRole('button', { name: 'Rain', exact: true }).click();
  assert.equal(await page.evaluate(() => window.__diorama.rainEnabled), false, 'Mobile rain toggle');

  const accessible = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 1000, height: 800 } });
  accessible.on('pageerror', error => errors.push(error.message));
  await accessible.goto(url, { waitUntil: 'networkidle' });
  await accessible.waitForFunction(() => window.__DIORAMA_READY__, null, { timeout: 90000 });
  assert.equal(await accessible.evaluate(() => window.__diorama.rainEnabled), false, 'Respects reduced motion');
  await accessible.keyboard.press('r');
  assert.equal(await accessible.evaluate(() => window.__diorama.rainEnabled), true, 'Explicit rain opt-in');
  await accessible.close();
  assert.deepEqual(errors, [], 'No browser or WebGL errors');
  console.log('✓ Desktop, mobile, drag, zoom, rain, neon, orbit, reset, postcard and reduced motion.');
  console.log('✓ No browser errors. Screenshots saved in artifacts/.');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
