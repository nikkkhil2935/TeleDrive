# Security Model & Threat Assessment

## Key Protections

1. **Client-Held Keys**: Sessions can be encrypted with AES-256-GCM using PBKDF2 (100,000 iterations). Keys never leave browser RAM unencrypted.
2. **True Revocation**: Logging out invokes `Api.auth.LogOut` to revoke authorization keys on Telegram's servers.
3. **Account Isolation**: IndexedDB records are strictly scoped to the authenticated channel ID or user ID.
4. **Nuclear Panic Wipe**: In emergencies, users can clear all local storage, indexed records, and cache in under 50 milliseconds.
5. **Strict Content Security**: No external scripts or tracking endpoints are permitted.
