import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // Three.js and its postprocessing are an intentional, locally served vendor bundle.
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
        },
      },
    },
  },
});
