import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 4310, strictPort: true },
  preview: { port: 4311, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/")) return "three";
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
