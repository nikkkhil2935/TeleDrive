import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { TimelineView } from './components/TimelineView';
import { AlbumsView } from './components/AlbumsView';
import { MediaViewer } from './components/MediaViewer';
import { UploadBanner } from './components/UploadBanner';
import { AuthModal } from './components/AuthModal';
import { RebuildModal } from './components/RebuildModal';
import { StorageInsightModal } from './components/StorageInsightModal';
import { TransferManagerModal } from './components/TransferManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { useApp } from './context/AppContext';
import { db } from './db';

let isSeeding = false;

// Helper to seed initial sample media if database is completely empty
async function seedInitialDemoPhotosIfEmpty() {
  if (isSeeding) return;
  isSeeding = true;

  try {
    const count = await db.media.count();
    if (count > 0) return;

    const createSvgDataUrl = (title: string, color1: string, color2: string) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${color1}"/>
            <stop offset="100%" stop-color="${color2}"/>
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#g)"/>
        <circle cx="200" cy="180" r="70" fill="white" opacity="0.85"/>
        <text x="200" y="320" font-family="sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${title}</text>
      </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    };

    const sampleItems = [
      {
        messageId: 1042,
        libraryId: '2093810291',
        kind: 'photo' as const,
        filename: 'IMG_20260314_092100_HDR.HEIC',
        mimeType: 'image/heic',
        sizeBytes: 21915238, // 20.9 MB
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        width: 4032,
        height: 3024,
        takenAt: '2026-11-21T09:21:00.000Z',
        latitude: 15.2993,
        longitude: 74.1240,
        thumbnailDataUrl: createSvgDataUrl('Sunset at Goa Beach', '#f97316', '#4338ca'),
        isFavorite: true,
        isArchived: false,
        uploadedAt: '2026-11-21T09:25:00.000Z',
        albums: ['Goa Vacation', 'Favorites'],
      },
      {
        messageId: 1043,
        libraryId: '2093810291',
        kind: 'video' as const,
        filename: 'VID_20261121_114512.MP4',
        mimeType: 'video/mp4',
        sizeBytes: 45088210, // 43 MB
        sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        width: 1920,
        height: 1080,
        durationMs: 42000,
        takenAt: '2026-11-21T11:45:00.000Z',
        thumbnailDataUrl: createSvgDataUrl('Alpine Mountain Trail', '#0284c7', '#0f172a'),
        isFavorite: false,
        isArchived: false,
        uploadedAt: '2026-11-21T11:48:00.000Z',
        albums: ['Hiking'],
      },
      {
        messageId: 1044,
        libraryId: '2093810291',
        kind: 'photo' as const,
        filename: 'DSC_0891_COAST.JPG',
        mimeType: 'image/jpeg',
        sizeBytes: 8421000,
        sha256: 'cb329eab45c308e7c4f5f8336332cb5e6fabc2024841fe806e5799e0ced52966',
        width: 6000,
        height: 4000,
        takenAt: '2026-11-21T14:15:00.000Z',
        thumbnailDataUrl: createSvgDataUrl('Pacific Coast Cliffs', '#0d9488', '#06b6d4'),
        isFavorite: true,
        isArchived: false,
        uploadedAt: '2026-11-21T14:20:00.000Z',
        albums: ['Travel'],
      },
      {
        messageId: 1045,
        libraryId: '2093810291',
        kind: 'photo' as const,
        filename: 'ARCH_STUDY_MODERN.PNG',
        mimeType: 'image/png',
        sizeBytes: 12450000,
        sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        width: 3840,
        height: 2160,
        takenAt: '2026-11-20T16:30:00.000Z',
        thumbnailDataUrl: createSvgDataUrl('Modern Glass Architecture', '#64748b', '#1e293b'),
        isFavorite: false,
        isArchived: false,
        uploadedAt: '2026-11-20T16:35:00.000Z',
        albums: ['Architecture'],
      },
    ];

    for (const item of sampleItems) {
      await db.media.put(item);
    }
  } catch (err) {
    console.warn('Seeding initial demo photos failed or skipped:', err);
  } finally {
    isSeeding = false;
  }
}

export const App: React.FC = () => {
  const { activeTab } = useApp();

  useEffect(() => {
    seedInitialDemoPhotosIfEmpty();
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 pb-16 md:pb-0">
          {activeTab === 'albums' ? <AlbumsView /> : <TimelineView />}
        </main>
      </div>

      {/* Google Photos Style Mobile Bottom Navigation */}
      <BottomNav />

      <MediaViewer />
      <UploadBanner />
      <AuthModal />
      <RebuildModal />
      <StorageInsightModal />
      <TransferManagerModal />
      <SettingsModal />
    </div>
  );
};
