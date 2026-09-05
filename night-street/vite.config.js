import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // The WebGL engine is intentionally a separate, cacheable dependency.
    rollupOptions: { output: { manualChunks: { three: ['three'] } } },
    chunkSizeWarningLimit: 650,
  },
});
