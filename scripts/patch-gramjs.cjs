const fs = require('fs');
const path = require('path');

// 1. Patch generationHelpers.js for robust Buffer serialization across any polyfill / realm
const targetFile = path.resolve(__dirname, '../node_modules/telegram/tl/generationHelpers.js');
if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  const startIdx = content.indexOf('function serializeBytes(data) {');
  const endIdx = content.indexOf('const r = [];', startIdx);
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
    content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-gramjs] Successfully patched generationHelpers.js');
  }
}

// 2. Patch uploads.js for DOM File, large file streaming, and thumb CustomFile support
const uploadsFile = path.resolve(__dirname, '../node_modules/telegram/client/uploads.js');
if (fs.existsSync(uploadsFile)) {
  let uploadsContent = fs.readFileSync(uploadsFile, 'utf8');
  let changed = false;

  // Patch CustomBuffer to support on-demand slicing of browser File / Blob without memory blowup
  const oldCustomBuffer = `class CustomBuffer {
    constructor(options) {
        this.options = options;
        if (!options.buffer && !options.filePath) {
            throw new Error("Either one of \`buffer\` or \`filePath\` should be specified");
        }
    }
    async slice(begin, end) {
        const { buffer, filePath } = this.options;
        if (buffer) {
            return buffer.slice(begin, end);
        }
        else if (filePath) {
            const buffSize = end - begin;
            const buff = Buffer.alloc(buffSize);
            const fHandle = await fs_1.promises.open(filePath, "r");
            await fHandle.read(buff, 0, buffSize, begin);
            await fHandle.close();
            return Buffer.from(buff);
        }
        return Buffer.alloc(0);
    }
}`;

  const newCustomBuffer = `class CustomBuffer {
    constructor(options) {
        this.options = options;
        if (!options.buffer && !options.filePath && !options.file) {
            throw new Error("Either one of \`buffer\` or \`filePath\` or \`file\` should be specified");
        }
    }
    async slice(begin, end) {
        const { buffer, filePath, file } = this.options;
        if (buffer) {
            return buffer.slice(begin, end);
        }
        else if (file && typeof file.slice === "function") {
            const blobSlice = file.slice(begin, end);
            const arrayBuffer = await blobSlice.arrayBuffer();
            return Buffer.from(arrayBuffer);
        }
        else if (filePath) {
            const buffSize = end - begin;
            const buff = Buffer.alloc(buffSize);
            const fHandle = await fs_1.promises.open(filePath, "r");
            await fHandle.read(buff, 0, buffSize, begin);
            await fHandle.close();
            return Buffer.from(buff);
        }
        return Buffer.alloc(0);
    }
}`;

  if (uploadsContent.includes('!options.buffer && !options.filePath') && !uploadsContent.includes('options.file')) {
    uploadsContent = uploadsContent.replace(oldCustomBuffer, newCustomBuffer);
    changed = true;
    console.log('[patch-gramjs] Successfully patched CustomBuffer for browser File streaming');
  }

  // Patch getFileBuffer to support DOM File streaming and CustomFile.buffer
  const oldGetFileBuffer = `async function getFileBuffer(file, fileSize, maxBufferSize) {
    const options = {};
    if (fileSize > maxBufferSize && file instanceof CustomFile) {
        options.filePath = file.path;
    }
    else {
        options.buffer = Buffer.from(await fileToBuffer(file));
    }
    return new CustomBuffer(options);
}`;

  const newGetFileBuffer = `async function getFileBuffer(file, fileSize, maxBufferSize) {
    const options = {};
    if (file && typeof file.slice === "function" && !(file instanceof CustomFile && file.buffer)) {
        options.file = file;
    }
    else if (file instanceof CustomFile && file.buffer) {
        options.buffer = file.buffer;
    }
    else if (fileSize > maxBufferSize && file instanceof CustomFile && file.path) {
        options.filePath = file.path;
    }
    else {
        options.buffer = Buffer.from(await fileToBuffer(file));
    }
    return new CustomBuffer(options);
}`;

  if (uploadsContent.includes('fileSize > maxBufferSize && file instanceof CustomFile') && !uploadsContent.includes('options.file = file')) {
    uploadsContent = uploadsContent.replace(oldGetFileBuffer, newGetFileBuffer);
    changed = true;
    console.log('[patch-gramjs] Successfully patched getFileBuffer for high-speed chunk streaming');
  }

  // Patch default workers to 4 for high-speed uploads
  if (uploadsContent.includes('if (!workers || !size) {\n        workers = 1;') || uploadsContent.includes('if (!workers || !size) {\r\n        workers = 1;')) {
    uploadsContent = uploadsContent.replace(
      /if \(!workers \|\| !size\) \{\r?\n\s+workers = 1;/g,
      'if (!workers || !size) {\n        workers = 4;'
    );
    changed = true;
    console.log('[patch-gramjs] Successfully boosted upload workers to 4');
  }

  // Patch line 174: avoid misclassifying DOM File as un-uploadable TL object
  const search1 = '!(file instanceof CustomFile)';
  const search2 = '!("read" in file)';
  const idx1 = uploadsContent.indexOf(search1);
  const idx2 = uploadsContent.indexOf(search2, idx1);
  if (idx1 !== -1 && idx2 !== -1 && !uploadsContent.slice(idx1, idx2 + 30).includes('file instanceof File')) {
    const replacement = '!(file instanceof CustomFile) && !(typeof File !== "undefined" && file instanceof File) && ';
    uploadsContent = uploadsContent.slice(0, idx1) + replacement + uploadsContent.slice(idx2);
    changed = true;
    console.log('[patch-gramjs] Successfully patched uploads.js for DOM File upload');
  }

  // Patch line 286: support CustomFile for thumb
  if (uploadsContent.includes('else if (typeof File !== "undefined" && thumb instanceof File)') && !uploadsContent.includes('thumb instanceof CustomFile')) {
    uploadsContent = uploadsContent.replace(
      'else if (typeof File !== "undefined" && thumb instanceof File)',
      'else if ((typeof File !== "undefined" && thumb instanceof File) || (typeof CustomFile !== "undefined" && thumb instanceof CustomFile))'
    );
    changed = true;
    console.log('[patch-gramjs] Successfully patched uploads.js for thumbnail CustomFile');
  }

  if (changed) {
    fs.writeFileSync(uploadsFile, uploadsContent, 'utf8');
  }
}
