import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

function patchGramJsPlugin(): Plugin {
  return {
    name: 'patch-gramjs',
    transform(code: string, id: string) {
      let modified = code;
      let hasChange = false;

      if (id.includes('generationHelpers') || code.includes('Bytes or str expected')) {
        const startIdx = modified.indexOf('function serializeBytes(data) {');
        const endIdx = modified.indexOf('const r = [];', startIdx);
        if (startIdx !== -1 && endIdx !== -1) {
          const replacement = `function serializeBytes(data) {
    if (typeof data === "string" || Buffer.isBuffer(data) || (data && (data._isBuffer || data.constructor?.name === "Buffer" || data instanceof Uint8Array))) {
        if (!(data instanceof Buffer)) data = Buffer.from(data);
    } else {
        throw Error("Bytes or str expected, not " + (data?.constructor?.name || typeof data));
    }
    `;
          modified = modified.slice(0, startIdx) + replacement + modified.slice(endIdx);
          hasChange = true;
        }
      }

      if (id.includes('uploads') || code.includes('Could not create file from')) {
        if (modified.includes('else if (typeof File !== "undefined" && thumb instanceof File)') && !modified.includes('thumb instanceof CustomFile')) {
          modified = modified.replace(
            'else if (typeof File !== "undefined" && thumb instanceof File)',
            'else if ((typeof File !== "undefined" && thumb instanceof File) || (typeof CustomFile !== "undefined" && thumb instanceof CustomFile))'
          );
          hasChange = true;
        }
      }

      return hasChange ? { code: modified, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: [
    patchGramJsPlugin(),
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
