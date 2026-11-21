# ADR 0001: Telegram Client Transport

## Context
Lumio Photos requires browser-to-Telegram communication without hosting intermediary backend servers.

## Decision
Connect directly using client-side MTProto WebSockets over TLS. For large file transfers, employ chunk-level sliced stream processing to manage browser heap limitations.

## Consequences
- Requires no centralized server infrastructure.
- Zero server hosting maintenance costs.
- Requires browser-compatible buffer handling and cross-realm polyfills.
