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
    if (typeof data === "string") {
        data = Buffer.from(data);
    } else if (data && (Buffer.isBuffer(data) || data._isBuffer || data.constructor?.name === "Buffer" || data instanceof Uint8Array || ArrayBuffer.isView(data) || data instanceof ArrayBuffer)) {
        if (data instanceof ArrayBuffer) {
            data = Buffer.from(data);
        } else {
            data = Buffer.from(data.buffer || data, data.byteOffset || 0, data.byteLength || data.length);
        }
    } else if (data && typeof data === "object") {
        try {
            data = Buffer.from(data);
        } catch (e) {
            throw Error("Bytes or str expected, not " + (data?.constructor?.name || typeof data));
        }
    } else {
        throw Error("Bytes or str expected, not " + (data?.constructor?.name || typeof data));
    }
    `;
          modified = modified.slice(0, startIdx) + replacement + modified.slice(endIdx);
          hasChange = true;
        }
      }

      if (id.includes('uploads') || code.includes('Could not create file from')) {
        const search1 = '!(file instanceof CustomFile)';
        const search2 = '!("read" in file)';
        const idx1 = modified.indexOf(search1);
        const idx2 = modified.indexOf(search2, idx1);
        if (idx1 !== -1 && idx2 !== -1 && !modified.slice(idx1, idx2 + 30).includes('file instanceof File')) {
          const replacement = '!(file instanceof CustomFile) && !(typeof File !== "undefined" && file instanceof File) && ';
          modified = modified.slice(0, idx1) + replacement + modified.slice(idx2);
          hasChange = true;
        }

        if (modified.includes('else if (typeof File !== "undefined" && thumb instanceof File)') && !modified.includes('thumb instanceof CustomFile')) {
          modified = modified.replace(
            'else if (typeof File !== "undefined" && thumb instanceof File)',
            'else if ((typeof File !== "undefined" && thumb instanceof File) || (typeof CustomFile !== "undefined" && thumb instanceof CustomFile))'
          );
          hasChange = true;
        }

        // CustomBuffer and getFileBuffer browser File on-demand slicing patch
        if (modified.includes('!options.buffer && !options.filePath') && !modified.includes('options.file')) {
          modified = modified.replace(
            '!options.buffer && !options.filePath',
            '!options.buffer && !options.filePath && !options.file'
          );
          const oldSlice = 'if (buffer) {\n            return buffer.slice(begin, end);\n        }';
          const newSlice = `if (buffer) {
            return buffer.slice(begin, end);
        } else if (file && typeof file.slice === "function") {
            const blobSlice = file.slice(begin, end);
            const arrayBuffer = await blobSlice.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }`;
          if (modified.includes('return buffer.slice(begin, end);')) {
            modified = modified.replace(
              /if \(buffer\) \{\s+return buffer\.slice\(begin, end\);\s+\}/,
              newSlice
            );
          }
          hasChange = true;
        }

        if (modified.includes('fileSize > maxBufferSize && file instanceof CustomFile') && !modified.includes('options.file = file')) {
          modified = modified.replace(
            'if (fileSize > maxBufferSize && file instanceof CustomFile) {',
            'if (file && typeof file.slice === "function" && !(file instanceof CustomFile && file.buffer)) { options.file = file; } else if (file instanceof CustomFile && file.buffer) { options.buffer = file.buffer; } else if (fileSize > maxBufferSize && file instanceof CustomFile && file.path) {'
          );
          hasChange = true;
        }

        if (modified.includes('workers = 1;')) {
          modified = modified.replace(/workers = 1;/g, 'workers = 4;');
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
