# SECURITY.md — Security Policy & Controls

This document details the operational security controls, cryptographic implementations, and incident response procedures for Telegram Photos.

---

## 1. Security Architecture & Controls

### 1.1 Cryptographic Primitives (WebCrypto Standard)
- **Key Derivation Function (KDF)**: PBKDF2 with HMAC-SHA-256, 100,000 iterations, with a cryptographically secure 16-byte random salt (`crypto.getRandomValues`).
- **Symmetric Encryption**: AES-256-GCM with a 12-byte random initialization vector (IV) per encryption operation.
- **Integrity & Checksums**: SHA-256 content digest authenticated per media document.
- **Zeroization**: Sensitive cryptographic buffers and decrypted sessions are overwritten with zeroes (`crypto.getRandomValues` or `.fill(0)`) upon Lock or Logout.

### 1.2 Session Isolation & Clean Logout Policy
- **No Plaintext Persistence**: Telegram session strings, auth keys, and API hashes are NEVER stored in plaintext in `localStorage`, `sessionStorage`, cookies, or `IndexedDB`.
- **Account Scoping**: IndexedDB media rows are strictly partitioned by `libraryId` matching the active session. If an account is logged out, the local index is completely purged.
- **Server-Side Invalidation**: When the user clicks "Log Out", the app explicitly invokes Telegram MTProto `Api.auth.LogOut()` to revoke the authorization on Telegram data centers.
- **Local Nuclear Wipe**: Following server logout, the app immediately executes:
  1. Deletion of the Dexie IndexedDB database.
  2. Clearing of all `localStorage` and `sessionStorage` entries.
  3. Revocation of all created `URL.createObjectURL` references.
  4. Disconnection of MTProto WebSocket transport.
  5. In-memory garbage collection of credentials.

### 1.3 Auto-Lock & Single-Tab Protection
- **Inactivity Auto-Lock**: After 15 minutes without user mouse/keyboard input, the app transitions to Locked state.
- **Hidden Tab Auto-Lock**: If the tab is minimized or hidden for greater than 5 minutes (`document.visibilityState === 'hidden'`), the session is automatically locked.
- **Single-Tab Coordinator**: Uses `BroadcastChannel('tg_vault_channel')` and the Web Locks API to ensure that only one tab holds active MTProto communication. A secondary tab displays an explicit "Session Active in Another Tab" warning to prevent session corruption.
- **Panic Wipe**: An instant, non-delayed Panic Wipe button is available in the UI to instantly wipe all local data in under 50ms without waiting for network responses.

---

## 2. Secure Coding Practices
- **Content Security Policy**: `default-src 'none'`, `connect-src wss://*.web.telegram.org:443`, `img-src 'self' blob: data:`, `media-src 'self' blob:`.
- **Zero Inline Script Execution**: No `eval()`, `new Function()`, or `dangerouslySetInnerHTML`.
- **Input Sanitization**: File names are sanitized to prevent path traversal or injection.

---

## 3. Incident Response & Responsible Disclosure

If a security vulnerability or session integrity anomaly is detected:
1. **Trigger Panic Wipe**: Immediately click the Panic Wipe button in Settings to purge all local storage.
2. **Revoke Authorizations**: Go to Telegram Mobile -> Settings -> Devices -> Terminate All Other Sessions.
3. **Change Telegram 2FA Cloud Password**: Enable or rotate your Telegram Cloud Password.
4. **Report Vulnerability**: Please report any security findings via GitHub Issues with the `[SECURITY]` tag or responsible disclosure email.
