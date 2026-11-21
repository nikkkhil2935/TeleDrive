import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      buffer: path.resolve(import.meta.dirname, 'node_modules/buffer'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 3000,
  },
});
