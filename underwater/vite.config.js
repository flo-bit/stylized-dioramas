import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1', port: 5193, strictPort: true,
    watch: { ignored: ['**/screenshots/**', '**/test-results/**', '**/playwright-report/**'] },
  },
  preview: { host: '127.0.0.1', port: 4193, strictPort: true },
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [{ name: 'three', test: /node_modules\/three/ }] },
      },
    },
  },
});
