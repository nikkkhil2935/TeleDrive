# THREAT_MODEL.md — Telegram Photos Security Architecture

This document formalizes the threat model for the **Telegram Photos** client-side application. It maps assets, threat actors, trust boundaries, mitigations, and residual risks in accordance with OWASP ASVS Level 2/3 guidelines.

---

## 1. Assets and Impact

| Asset | Sensitivity | Impact of Compromise | Storage Location | Protection Mechanism |
|---|---|---|---|---|
| **Telegram Session String & Auth Key** | Critical | Full Telegram account takeover | Encrypted at rest in browser storage | AES-256-GCM wrapped with Vault Passphrase key (PBKDF2 SHA-256, 100k iters); never plaintext |
| **API ID & API Hash** | High | Abuse by third-party, API limiting | Encrypted at rest inside Session payload | Same as session string; never logged or exposed |
| **Vault Master Key & Passphrase** | Critical | Decryption of all photos and sessions | In-memory only while unlocked | Ephemeral; zeroized on Lock, Idle timeout, or Logout |
| **Photos & Videos** | Critical | Leak of personal media files | Telegram cloud (private channel) & local cache | Ephemeral Object URLs; encrypted at rest; revoked on close |
| **EXIF Metadata (GPS, Dates, Camera)** | High | Geolocation tracking, privacy violation | In-memory & local IndexedDB | Scoped to authenticated channel; wiped on logout |
| **Local Index (Dexie Database)** | High | Enumeration of user media history | IndexedDB (`TelegramPhotosDB_v2`) | Scoped per-account; completely wiped upon logout or panic wipe |
| **Application Integrity** | Critical | Code tampering, session exfiltration | Static web bundle | Subresource integrity, strict CSP, Trusted Types |

---

## 2. Threat Actors & Adversaries

1. **Adversary 1: Malicious Injected Script (XSS / Extension / Malicious NPM Package)**
   - *Goal*: Steal session key or exfiltrate media.
   - *Mitigations*: Strict Content Security Policy (`default-src 'none'`, `connect-src` limited to Telegram WSS), non-extractable keys, zero `eval` / `dangerouslySetInnerHTML`, sanitized text sinks, zero third-party telemetry/analytics.

2. **Adversary 2: Phishing Clone / Man-in-the-Middle**
   - *Goal*: Intercept login credentials, 2FA cloud password, or SMS code.
   - *Mitigations*: Prominent canonical domain badge and anti-phishing advisory; direct SRP 2FA calculation without server intermediaries; official QR code authentication.

3. **Adversary 3: Malicious File Crafter (Decompression Bombs, Corrupt Codecs, Zip-Slip)**
   - *Goal*: Exploit parser vulnerabilities, exhaust client memory, or escape file paths.
   - *Mitigations*: Strict MIME allowlist, magic byte verification, memory allocation safeguards, safe fallback video frame generators, 2 GB hard limit, path sanitization.

4. **Adversary 4: Device Thief / Shared Computer Observer**
   - *Goal*: Access media or session after the user leaves their laptop or browser open.
   - *Mitigations*: Auto-lock after 15 minutes of inactivity; background tab auto-lock after 5 minutes; 1-click manual lock; 1-click **Panic Wipe** button that completely zeroizes all local IndexedDB, localStorage, and caches.

5. **Adversary 5: Malicious Multi-Tab Opener**
   - *Goal*: Corrupt MTProto state or auth keys by running simultaneous concurrent sessions.
   - *Mitigations*: Web Locks API & `BroadcastChannel('tg_vault_channel')` ensuring strictly one tab controls MTProto at any time.

6. **Adversary 6: Curious or Compromised Storage Provider (Telegram)**
   - *Goal*: Read or index photos stored in cloud.
   - *Mitigations*: Client-side private channels; uncompressed binary document uploads; custom client caption schemas with cryptographic checksums.

---

## 3. Trust Boundaries

```
[ User Browser Environment (Trusted if Uncompromised) ]
       │
       ├── WebCrypto Engine (AES-256-GCM / PBKDF2)
       ├── In-Memory Ephemeral State (Zeroized on lock)
       └── Encrypted LocalStorage / Scoped IndexedDB
       │
═══════╪═══════════════════════════════════════════════════════════
       │ [ Direct MTProto WebSocket (WSS / TLS 1.3) ]
       ▼
[ Telegram Data Centers (flora.web.telegram.org:443) ]
       │ (Untrusted for confidentiality; trusted for availability)
```

---

## 4. Residual Risks & Disclosures

1. **OS-Level Keyloggers / Root Malware**: If the host OS is compromised by root spyware, keystrokes or browser memory can be inspected. Mitigation: hardware 2FA and dedicated library accounts.
2. **Telegram Availability**: If Telegram servers experience an outage or terminate the channel, data depends on user backups. Mitigation: batch ZIP export and local backup utilities.
3. **Phishing Awareness**: Users must ensure they only use the official verified domain when entering Telegram authentication codes.
