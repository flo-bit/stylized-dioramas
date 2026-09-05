import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  expect: { timeout: 20_000 },
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:43871',
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    launchOptions: { args: ['--enable-webgl', '--ignore-gpu-blocklist', process.platform === 'darwin' ? '--use-angle=metal' : '--use-angle=swiftshader'] },
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 43871 --strictPort',
    url: 'http://127.0.0.1:43871',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
