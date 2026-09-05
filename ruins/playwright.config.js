import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4186',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])] },
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:4186',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
