import { defineConfig } from '@playwright/test';

const base = process.env.SITE_BASE || '/';
const origin = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: process.env.TEST_URL || `${origin}${base}`,
    viewport: { width: 1440, height: 1000 },
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.TEST_URL ? undefined : {
    command: 'pnpm preview',
    url: `${origin}${base}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
