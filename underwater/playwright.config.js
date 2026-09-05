import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 8000 },
  use: {
    baseURL: 'http://127.0.0.1:4193',
    viewport: { width: 1440, height: 900 },
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm build && pnpm preview',
    url: 'http://127.0.0.1:4193',
    reuseExistingServer: true,
    timeout: 20000,
  },
});
