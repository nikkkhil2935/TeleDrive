const fs = require('fs');
const path = require('path');

// 1. Patch generationHelpers.js for 2FA Buffer serialization
const targetFile = path.resolve(__dirname, '../node_modules/telegram/tl/generationHelpers.js');
if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  const startIdx = content.indexOf('function serializeBytes(data) {');
  const endIdx = content.indexOf('const r = [];', startIdx);
  if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `function serializeBytes(data) {
    if (typeof data === "string" || Buffer.isBuffer(data) || (data && (data._isBuffer || data.constructor?.name === "Buffer" || data instanceof Uint8Array))) {
        if (!(data instanceof Buffer)) data = Buffer.from(data);
    } else {
        throw Error("Bytes or str expected, not " + (data?.constructor?.name || typeof data));
    }
    `;
    content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('[patch-gramjs] Successfully patched generationHelpers.js');
  }
}

// 2. Patch uploads.js for thumb CustomFile support
const uploadsFile = path.resolve(__dirname, '../node_modules/telegram/client/uploads.js');
if (fs.existsSync(uploadsFile)) {
  let uploadsContent = fs.readFileSync(uploadsFile, 'utf8');
  if (uploadsContent.includes('else if (typeof File !== "undefined" && thumb instanceof File)') && !uploadsContent.includes('thumb instanceof CustomFile')) {
    uploadsContent = uploadsContent.replace(
      'else if (typeof File !== "undefined" && thumb instanceof File)',
      'else if ((typeof File !== "undefined" && thumb instanceof File) || (typeof CustomFile !== "undefined" && thumb instanceof CustomFile))'
    );
    fs.writeFileSync(uploadsFile, uploadsContent, 'utf8');
    console.log('[patch-gramjs] Successfully patched uploads.js for thumbnail CustomFile');
  }
}
