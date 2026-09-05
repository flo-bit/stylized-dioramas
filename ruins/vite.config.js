import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0', port: 4186, strictPort: true },
  preview: { host: '0.0.0.0', port: 4187, strictPort: true },
  build: { chunkSizeWarningLimit: 900 },
});
