import { Buffer } from 'buffer';

// Ensure global Buffer and window.Buffer are defined
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
  (globalThis as any).global = globalThis;
}

/**
 * Patch Buffer[Symbol.hasInstance] to allow cross-realm and dual-polyfill compatibility.
 * This fixes GramJS's `if (!(data instanceof Buffer))` check in generationHelpers.js
 * when data comes from node-stdlib-browser's crypto or differing buffer versions.
 */
function applyBufferHasInstance(BufClass: any) {
  if (!BufClass) return;
  try {
    Object.defineProperty(BufClass, Symbol.hasInstance, {
      value: function (instance: any) {
        if (!instance) return false;
        return (
          instance._isBuffer === true ||
          instance.constructor?.name === 'Buffer' ||
          (typeof Uint8Array !== 'undefined' && instance instanceof Uint8Array && (instance.constructor?.name === 'Buffer' || (instance as any)._isBuffer)) ||
          (typeof BufClass.isBuffer === 'function' && BufClass.isBuffer(instance))
        );
      },
      configurable: true,
    });
  } catch (e) {
    console.warn('Could not define Symbol.hasInstance on Buffer:', e);
  }
}

applyBufferHasInstance(Buffer);
if (typeof window !== 'undefined' && (window as any).Buffer) {
  applyBufferHasInstance((window as any).Buffer);
}
if (typeof globalThis !== 'undefined' && (globalThis as any).Buffer) {
  applyBufferHasInstance((globalThis as any).Buffer);
}

/**
 * Polyfill 'base64url' encoding support on Buffer.prototype.toString.
 * In browser polyfills that only support standard base64, 'base64url' throws:
 * `TypeError: Unknown encoding: base64url`.
 */
function applyBase64UrlPatch(BufClass: any) {
  if (!BufClass || !BufClass.prototype) return;
  const origToString = BufClass.prototype.toString;
  BufClass.prototype.toString = function (this: any, encoding?: string, start?: number, end?: number) {
    if (encoding === 'base64url') {
      const b64 = origToString.call(this, 'base64', start, end);
      return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return origToString.apply(this, arguments as any);
  };
}

applyBase64UrlPatch(Buffer);
if (typeof window !== 'undefined' && (window as any).Buffer) {
  applyBase64UrlPatch((window as any).Buffer);
}
if (typeof globalThis !== 'undefined' && (globalThis as any).Buffer) {
  applyBase64UrlPatch((globalThis as any).Buffer);
}

export { Buffer };
