# Lumio Photos Architecture

## System Overview

Lumio Photos is a client-first Single Page Application (SPA) built with React, TypeScript, Vite, Tailwind CSS, and Dexie.js (IndexedDB).

```
┌────────────────────────────────────────────────────────┐
│                   User Browser Client                  │
│                                                        │
│  ┌─────────────────┐             ┌──────────────────┐  │
│  │   UI Components │ ◄─────────► │  Dexie IndexedDB │  │
│  │ (Google Layout) │             │  (Local Index)   │  │
│  └────────┬────────┘             └─────────┬────────┘  │
│           │                                │           │
│           ▼                                ▼           │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Transfer Queue & Client MTProto WSS       │  │
│  │        (Offscreen Canvas & Sliced Streaming)     │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │
               Direct TLS Encrypted WSS
               Zero Intermediate Servers
                            │
                            ▼
           ┌──────────────────────────────────┐
           │      Telegram Data Centers       │
           │  (Personal Channel / Cloud Docs) │
           └──────────────────────────────────┘
```

## Core Tenets
1. **Direct MTProto Transport**: Communicates over secure WebSockets directly to Telegram servers.
2. **Self-Contained Captions**: Message captions store JSON metadata (`v: 1`, dimensions, checksum, timestamp), enabling full library rebuilding from any new device in seconds.
3. **Chunked Streaming**: Files larger than 20 MB up to 2 GB stream seamlessly via sliced chunks without loading the entire file into JavaScript heap.
