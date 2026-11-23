import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { TimelineView } from './components/TimelineView';
import { AlbumsView } from './components/AlbumsView';
import { PeopleView } from './components/PeopleView';
import { PlacesView } from './components/PlacesView';
import { ExploreView } from './components/ExploreView';
import { SharingView } from './components/SharingView';
import { MediaViewer } from './components/MediaViewer';
import { UploadBanner } from './components/UploadBanner';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { DuplicatesModal } from './components/DuplicatesModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PrivacyModal } from './components/PrivacyModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { RebuildModal } from './components/RebuildModal';
import { StorageInsightModal } from './components/StorageInsightModal';
import { TransferManagerModal } from './components/TransferManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { VaultUnlockModal } from './components/VaultUnlockModal';
import { LandingPage } from './components/LandingPage';
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
  const { activeTab, isLandingOpen } = useApp();

  useEffect(() => {
    purgePlaceholderMedia();
  }, []);

  if (isLandingOpen) {
    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-white dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans transition-colors duration-200">
        <LandingPage />
        <AuthModal />
        <OnboardingModal />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8FAFD] dark:bg-[#131314] text-[#1F1F1F] dark:text-[#E3E3E3] font-sans transition-colors duration-200 select-none">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFD] dark:bg-[#131314] pb-16 md:pb-0">
          {activeTab === 'albums' ? (
            <AlbumsView />
          ) : activeTab === 'people' ? (
            <PeopleView />
          ) : activeTab === 'places' ? (
            <PlacesView />
          ) : activeTab === 'explore' ? (
            <ExploreView />
          ) : activeTab === 'sharing' ? (
            <SharingView />
          ) : (
            <TimelineView />
          )}
        </main>
      </div>

      {/* Google Photos Style Mobile Bottom Navigation with FAB */}
      <BottomNav />

      <MediaViewer />
      <UploadBanner />
      <AuthModal />
      <OnboardingModal />
      <DuplicatesModal />
      <CommandPaletteModal />
      <PrivacyModal />
      <KeyboardShortcutsModal />
      <RebuildModal />
      <StorageInsightModal />
      <TransferManagerModal />
      <SettingsModal />
      <VaultUnlockModal />
    </div>
  );
};
