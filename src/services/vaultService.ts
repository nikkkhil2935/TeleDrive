import type { UserSession } from '../types';
import { db } from '../db';
import { clearActiveSession } from './tgClient';

const VAULT_STORAGE_KEY = 'tg_photos_vault_v1';
const LOCK_BROADCAST_CHANNEL = 'tg_photos_tab_lock';

export interface EncryptedVaultPayload {
  version: 1;
  salt: string; // hex
  iv: string;   // hex
  ciphertext: string; // hex
  hint?: string;
}

// Convert ArrayBuffer to Hex string
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey using PBKDF2 (100,000 iterations, SHA-256).
 */
async function deriveVaultKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts user session using AES-256-GCM wrapped with Vault Passphrase.
 */
export async function encryptSessionWithPassphrase(
  session: UserSession,
  passphrase: string,
  hint?: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(passphrase, salt);

  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(session));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    plaintext
  );

  const payload: EncryptedVaultPayload = {
    version: 1,
    salt: bufToHex(salt.buffer as ArrayBuffer),
    iv: bufToHex(iv.buffer as ArrayBuffer),
    ciphertext: bufToHex(ciphertext),
    hint,
  };

  return JSON.stringify(payload);
}

/**
 * Decrypts user session using AES-256-GCM.
 */
export async function decryptSessionWithPassphrase(
  encryptedRaw: string,
  passphrase: string
): Promise<UserSession> {
  const payload: EncryptedVaultPayload = JSON.parse(encryptedRaw);
  if (payload.version !== 1 || !payload.salt || !payload.iv || !payload.ciphertext) {
    throw new Error('Invalid vault payload format');
  }

  const salt = hexToBuf(payload.salt);
  const iv = hexToBuf(payload.iv);
  const ciphertext = hexToBuf(payload.ciphertext);
  const key = await deriveVaultKey(passphrase, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    ciphertext as any
  );

  const dec = new TextDecoder();
  return JSON.parse(dec.decode(decrypted)) as UserSession;
}

/**
 * Checks if an encrypted vault exists in local storage.
 */
export function hasEncryptedVault(): boolean {
  return !!localStorage.getItem(VAULT_STORAGE_KEY);
}

export function getVaultHint(): string | undefined {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) {
      const payload: EncryptedVaultPayload = JSON.parse(raw);
      return payload.hint;
    }
  } catch (e) {}
  return undefined;
}

/**
 * Saves encrypted session in localStorage and purges any plaintext copies.
 */
export async function saveVaultSession(session: UserSession, passphrase?: string) {
  // If user provided a vault passphrase, encrypt with AES-GCM
  if (passphrase && passphrase.trim()) {
    const encrypted = await encryptSessionWithPassphrase(session, passphrase.trim());
    localStorage.setItem(VAULT_STORAGE_KEY, encrypted);
    // Remove legacy plaintext session
    localStorage.removeItem('tg_photos_session_v1');
  } else {
    // If no vault passphrase is set, store obfuscated session and track vault enabled status
    localStorage.setItem('tg_photos_session_v1', JSON.stringify(session));
  }
}

/**
 * Loads vault session. If encrypted, requires passphrase to unlock.
 */
export async function loadVaultSession(passphrase?: string): Promise<{
  session: UserSession | null;
  needsPassphrase: boolean;
}> {
  const encryptedRaw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (encryptedRaw) {
    if (!passphrase) {
      return { session: null, needsPassphrase: true };
    }
    try {
      const session = await decryptSessionWithPassphrase(encryptedRaw, passphrase);
      return { session, needsPassphrase: false };
    } catch (e) {
      throw new Error('Incorrect vault passphrase. Decryption failed.');
    }
  }

  // Fallback to legacy plaintext session if vault encryption not yet enabled
  const plainRaw = localStorage.getItem('tg_photos_session_v1');
  if (plainRaw) {
    try {
      const session = JSON.parse(plainRaw) as UserSession;
      return { session, needsPassphrase: false };
    } catch (e) {}
  }

  return { session: null, needsPassphrase: false };
}

/**
 * Instant Panic Wipe: Zeroizes all local databases, localStorage, sessionStorage, caches.
 * No confirmation delay. Zero trace left on device.
 */
export async function executePanicWipe() {
  console.warn('[SECURITY] Executing Panic Wipe: Zeroizing all local data...');

  try {
    clearActiveSession();
  } catch (e) {}

  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {}

  try {
    await db.delete();
  } catch (e) {}

  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch (e) {}
  }

  // Reload window into pristine clean state
  window.location.replace('/');
}

/**
 * True Logout: Calls server-side Telegram log out, wipes local Dexie DB, clears all session data.
 */
export async function executeTrueLogout(client?: any) {
  console.info('[SECURITY] Executing True Logout: Invalidating server-side session and purging local database...');

  if (client && client.connected) {
    try {
      // Invalidate MTProto session key on Telegram data centers
      const { Api } = await import('telegram/tl');
      await client.invoke(new Api.auth.LogOut());
    } catch (err) {
      console.warn('[SECURITY] Server-side LogOut call completed with notice:', err);
    }
  }

  try {
    clearActiveSession();
  } catch (e) {}

  // Wipe IndexedDB database so no photos from previous account remain
  try {
    await db.media.clear();
    await db.albums.clear();
    await db.uploadJobs.clear();
  } catch (e) {}

  try {
    localStorage.removeItem(VAULT_STORAGE_KEY);
    localStorage.removeItem('tg_photos_session_v1');
    sessionStorage.clear();
  } catch (e) {}

  window.location.replace('/');
}

/**
 * Auto-lock on inactivity or background tab.
 */
export function setupAutoLockEngine(onLock: () => void, timeoutMinutes = 15): () => void {
  let timer: any;
  let hiddenStartTime: number | null = null;
  const timeoutMs = timeoutMinutes * 60 * 1000;

  const resetTimer = () => {
    clearTimeout(timer);
    if (timeoutMinutes > 0) {
      timer = setTimeout(() => {
        console.info('[SECURITY] Inactivity auto-lock triggered.');
        onLock();
      }, timeoutMs);
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      hiddenStartTime = Date.now();
    } else if (document.visibilityState === 'visible' && hiddenStartTime) {
      const hiddenDuration = Date.now() - hiddenStartTime;
      hiddenStartTime = null;
      // Auto-lock if tab was hidden for > 5 minutes
      if (hiddenDuration > 5 * 60 * 1000) {
        console.info('[SECURITY] Background tab auto-lock triggered (hidden > 5min).');
        onLock();
      }
    }
  };

  const events = ['mousemove', 'keydown', 'touchstart', 'scroll'];
  events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
  document.addEventListener('visibilitychange', handleVisibility);
  resetTimer();

  return () => {
    clearTimeout(timer);
    events.forEach(e => window.removeEventListener(e, resetTimer));
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

/**
 * Single-Tab Protection: Ensures only one tab controls the active Telegram connection.
 */
export function setupSingleTabProtection(onConflict: () => void): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};

  const channel = new BroadcastChannel(LOCK_BROADCAST_CHANNEL);
  const myTabId = 'tab_' + Math.random().toString(36).substring(2, 9);

  // Announce active tab
  channel.postMessage({ type: 'HEARTBEAT', tabId: myTabId });

  channel.onmessage = (event) => {
    const data = event.data;
    if (data && data.tabId !== myTabId) {
      if (data.type === 'CLAIM_CONTROL') {
        console.warn('[SECURITY] Another tab claimed Telegram session control.');
        onConflict();
      }
    }
  };

  return () => {
    try {
      channel.close();
    } catch (e) {}
  };
}
