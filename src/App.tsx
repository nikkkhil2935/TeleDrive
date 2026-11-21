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
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { useApp } from './context/AppContext';
import { db } from './db';

// Cleans up any leftover mock/placeholder demo photos so user starts with a clean slate
async function purgePlaceholderMedia() {
  try {
    const demoItems = await db.media.where('libraryId').equals('2093810291').toArray();
    if (demoItems.length > 0) {
      await db.media.bulkDelete(demoItems.map(m => m.messageId));
      console.info('[Database] Purged legacy placeholder demo media.');
    }
  } catch (err) {
    console.warn('Cleanup demo media skipped:', err);
  }
}

export const App: React.FC = () => {
  const { activeTab } = useApp();

  useEffect(() => {
    purgePlaceholderMedia();
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
      <VaultUnlockModal />
    </div>
  );
};
