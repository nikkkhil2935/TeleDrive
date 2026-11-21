<div align="center">

<img src="assets/icon.svg" width="64" height="64" alt="Telegram Photos Icon">

# Telegram Photos

### A Google Photos clone powered entirely by your own Telegram account.

**Zero proprietary storage servers. Originals stored as documents in Telegram. Disposable, rebuildable local index.**

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GramJS](https://img.shields.io/badge/GramJS-MTProto-0088cc?style=flat-square&logo=telegram&logoColor=white)](https://github.com/gram-js/gramjs)
[![Dexie](https://img.shields.io/badge/Dexie.js-IndexedDB-336791?style=flat-square)](https://dexie.org/)

</div>

---

## Overview

Telegram Photos is a photo and video library application with a Google Photos-style experience (timeline, albums, search, favorites, trash, EXIF inspector) where the user's personal Telegram account is the storage backend.

- **Original Quality (Documents):** Photos and videos are uploaded as uncompressed Telegram documents (up to 2,000,000,000 bytes / 2 GB per file), bypassing Telegram's aggressive photo re-compression.
- **Embedded Caption Metadata:** Each message embeds a compact JSON schema (`v:1`) containing capture timestamp, dimensions, SHA-256 hash, original filename, and album tags.
- **Disposable & Rebuildable Index:** The local database (Dexie / IndexedDB) is an ephemeral cache. If a device is lost or browser storage is wiped, the entire library can be reconstructed in minutes by scanning the private channel's message captions.
- **Client-Side MTProto:** Runs 100% in the browser over WebSockets (`wss://<dc>.web.telegram.org/apiws`). No middleman server ever touches your credentials or media.
- **Durable Queue & Flood-Wait Resilience:** Chunked uploads (512 KB parts) with automatic exponential backoff on Telegram `FLOOD_WAIT_X` rate limits.

---

## Architecture

```mermaid
flowchart TD
    subgraph Browser ["Client Browser / PWA"]
        UI["React 19 UI (Timeline, Viewer, Search)"]
        Worker["Media Pipeline (EXIF, WebAssembly, Thumbnails)"]
        Queue["Durable Transfer Queue (IndexedDB)"]
        DB[("Local Index (Dexie.js)")]
        MTProto["GramJS Client (WebSocket WSS)"]
    end

    subgraph TelegramCloud ["User's Private Telegram Cloud"]
        Channel["Private Library Channel (#4082)"]
        Docs["Original Media Documents (≤ 2 GB)"]
        Thumbs["Message Thumbnails (256px JPEG)"]
        Captions["Metadata Caption JSON (v1)"]
    end

    UI -->|Select Media| Worker
    Worker -->|EXIF & 256px Thumb| Queue
    Queue -->|512 KB Chunks| MTProto
    MTProto -->|Upload Document| Channel
    Channel --> Docs & Thumbs & Captions
    MTProto -->|Scan Message Captions| DB
    DB -->|Cached Metadata & Thumbnails| UI
```

---

## Features (Phase 1 Implemented)

- [x] **Telegram Authentication:** Supports Phone + Verification Code, 2FA Cloud Password, and QR Code login flows.
- [x] **Channel Auto-Provisioning:** Creates and tracks a dedicated private channel for your photo library.
- [x] **Client-Side Media Pipeline:**
  - Extracts EXIF (date taken, camera make/model, focal length, ISO, GPS coordinates).
  - Client-side 256px JPEG thumbnail generation for instantaneous timeline rendering.
  - Video poster frame generation and duration detection.
  - SHA-256 hash calculation for content-based deduplication.
- [x] **Durable Transfer Queue:**
  - Chunked 512 KB uploads with live progress and transfer speed calculation.
  - Automatic `FLOOD_WAIT` detection and cooldown countdown timer.
  - Hard rejection guard for files exceeding 2,000,000,000 bytes (2 GB).
- [x] **Timeline Grid:**
  - Clustered by date (Today, Yesterday, Month).
  - Video duration badges and HDR indicators.
  - One-click favorite and trash toggles.
- [x] **Full-Screen Media Viewer:**
  - Full EXIF inspector (camera, lens, ISO, GPS map coordinates).
  - Telegram document invariants inspector (Message ID, Channel ID, Caption JSON v1).
- [x] **One-Click Index Rebuild:** Scans raw Telegram channel history and restores local index with zero data loss.
- [x] **Storage Insights:** Total storage usage breakdown by media type and timeline.

---

## Getting Started

### 1. Prerequisites
- Node.js >= 20
- npm >= 10

### 2. Development

```bash
# Clone the repository
git clone https://github.com/your-username/telegram-drive.git
cd telegram-drive

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build

```bash
npm run build
npm run preview
```

---

## Clean-Room Notice

This project was built clean-room from the ground up in TypeScript/React. While inspired by the storage patterns of `caamer20/Telegram-Drive`, zero source code was copied due to its proprietary licensing.
