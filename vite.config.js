import { defineConfig } from 'vite';

export default defineConfig({
  root: 'site',
  base: process.env.SITE_BASE || '/',
  build: { outDir: '../dist', emptyOutDir: true },
});
