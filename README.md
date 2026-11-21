# Lumio Photos (TeleDrive)

> **Privacy-first photo and video library using your own Telegram account as personal cloud storage.**
>
> *Your memories. Your storage. Your control.*

[![CI](https://github.com/nikkkhil2935/TeleDrive/actions/workflows/ci.yml/badge.svg)](https://github.com/nikkkhil2935/TeleDrive/actions/workflows/ci.yml)
[![Security Suite](https://github.com/nikkkhil2935/TeleDrive/actions/workflows/security.yml/badge.svg)](https://github.com/nikkkhil2935/TeleDrive/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue)](https://www.typescriptlang.org/)

---

## 🌟 Key Features

- **Google Photos Inspired UI**: Timeline grouped by date, sticky headers, responsive grid density, and smooth media inspection.
- **Original Quality Always**: Photos and videos up to 2 GB are uploaded as uncompressed documents with full EXIF metadata preserved.
- **Zero Middleman Servers**: Direct MTProto WebSocket connection from your browser to Telegram Data Centers. No third-party servers ever touch your files.
- **Client-Side Vault Encryption**: Optional zero-knowledge local encryption using AES-256-GCM and PBKDF2 (100,000 iterations).
- **Fast Date Scrubber**: Jump through years and months instantly with the vertical timeline scrubber.
- **Smart Duplicate Finder**: SHA-256 exact matching and visual comparison to clean up redundant photos and reclaim storage.
- **Transfer Engine**: Resumable queue with automatic backoff, flood-wait handling, and parallel chunk streaming.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22 or higher
- npm 10 or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/nikkkhil2935/TeleDrive.git
cd TeleDrive

# Install dependencies
npm install

# Run the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

```bash
# Run the automated security and cryptographic integrity test suite
npm test

# Build production bundle
npm run build
```

---

## ⚖️ Legal Disclaimer

*Stores your files in your own Telegram account. Lumio Photos is an independent open-source project and is not affiliated with, sponsored by, or endorsed by Telegram FZ-LLC or Google LLC.*
