import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import type { MediaItem, UserSession, UploadJob } from '../types';
import {
  getActiveSession,
  saveActiveSession,
  clearActiveSession,
  ensureLibraryChannel,
  getTelegramClient,
  syncRecentChannelMessages,
  startChannelLiveListener,
  clearFullMediaUrlCache,
} from '../services/tgClient';
import { transferQueue } from '../services/transferQueue';
import {
  hasEncryptedVault,
  loadVaultSession,
  saveVaultSession,
  executePanicWipe,
  executeTrueLogout,
  setupAutoLockEngine,
  setupSingleTabProtection,
} from '../services/vaultService';
import { db } from '../db';

export type ThemeMode = 'dark' | 'light' | 'midnight' | 'system';
export type BrandAccent = 'blue' | 'indigo' | 'teal' | 'coral';
export type GridDensity = 'small' | 'medium' | 'large';
export type MediaFilter = 'all' | 'photo' | 'video';
export type SortOption = 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'name-asc';

interface AppContextType {
  session: UserSession | null;
  setSession: (s: UserSession | null, passphrase?: string) => void;
  logout: () => Promise<void>;
  panicWipe: () => Promise<void>;
  isVaultLocked: boolean;
  unlockVault: (passphrase: string) => Promise<void>;
  lockVault: () => void;
  isAnotherTabActive: boolean;

  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  brandAccent: BrandAccent;
  setBrandAccent: (a: BrandAccent) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedMedia: MediaItem | null;
  setSelectedMedia: (m: MediaItem | null) => void;

  // Multi-selection
  selectedIds: Set<number>;
  toggleSelectId: (id: number) => void;
  selectAllIds: (ids: number[]) => void;
  clearSelection: () => void;

  // View Options
  gridDensity: GridDensity;
  setGridDensity: (d: GridDensity) => void;
  mediaFilter: MediaFilter;
  setMediaFilter: (f: MediaFilter) => void;
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;
  selectedAlbum: string | null;
  setSelectedAlbum: (a: string | null) => void;

  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  isDuplicatesOpen: boolean;
  setIsDuplicatesOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isPrivacyOpen: boolean;
  setIsPrivacyOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  isRebuildModalOpen: boolean;
  setIsRebuildModalOpen: (open: boolean) => void;
  isStorageModalOpen: boolean;
  setIsStorageModalOpen: (open: boolean) => void;
  isTransfersOpen: boolean;
  setIsTransfersOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isNewAlbumOpen: boolean;
  setIsNewAlbumOpen: (open: boolean) => void;

  // Telegram Cloud Sync
  isSyncing: boolean;
  syncLibrary: () => Promise<void>;

  // Transfers & Operations
  activeJobs: UploadJob[];
  uploadFiles: (files: File[]) => Promise<void>;
  toggleFavorite: (item: MediaItem) => Promise<void>;
  moveToTrash: (item: MediaItem) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Bulk Operations
  bulkToggleFavorite: () => Promise<void>;
  bulkMoveToTrash: () => Promise<void>;
  bulkDownloadZip: () => Promise<void>;
  bulkAddToAlbum: (albumName: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<UserSession | null>(() => {
    if (hasEncryptedVault()) return null;
    return getActiveSession();
  });
  const [isVaultLocked, setIsVaultLocked] = useState<boolean>(() => hasEncryptedVault());
  const [isAnotherTabActive, setIsAnotherTabActive] = useState(false);

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('tg_photos_theme') as ThemeMode) || 'dark';
  });
  const [activeTab, setActiveTab] = useState<string>('photos');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Layout & Filters
  const [gridDensity, setGridDensity] = useState<GridDensity>('medium');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isDuplicatesOpen, setIsDuplicatesOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isRebuildModalOpen, setIsRebuildModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isTransfersOpen, setIsTransfersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewAlbumOpen, setIsNewAlbumOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [brandAccent, setBrandAccentState] = useState<BrandAccent>(() => {
    return (localStorage.getItem('framely_brand_accent') as BrandAccent) || 'blue';
  });

  const setBrandAccent = (accent: BrandAccent) => {
    localStorage.setItem('framely_brand_accent', accent);
    setBrandAccentState(accent);
  };

  const [activeJobs, setActiveJobs] = useState<UploadJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Lock Vault
  const lockVault = useCallback(() => {
    clearActiveSession();
    setSessionState(null);
    setIsVaultLocked(true);
    setSelectedMedia(null);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockVault();
      } else if (e.key === '?' && !isInput) {
        e.preventDefault();
        setIsShortcutsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lockVault]);

  // Unlock Vault
  const unlockVault = async (passphrase: string) => {
    const { session: unlockedSession } = await loadVaultSession(passphrase);
    if (!unlockedSession) {
      throw new Error('Failed to decrypt session with provided passphrase.');
    }
    saveActiveSession(unlockedSession);
    setSessionState(unlockedSession);
    setIsVaultLocked(false);
  };

  // True Logout: server-side session revocation & complete local wipe
  const logout = async () => {
    try {
      clearFullMediaUrlCache();
      transferQueue.clearAll();
      setSelectedMedia(null);
      setSelectedIds(new Set());
      setSessionState(null);
      const client = await getTelegramClient();
      await executeTrueLogout(client);
    } catch (e) {
      await executeTrueLogout(null);
    }
  };

  // Instant Nuclear Panic Wipe
  const panicWipe = async () => {
    await executePanicWipe();
  };

  // Single-Tab Protection setup
  useEffect(() => {
    const cleanup = setupSingleTabProtection(() => {
      setIsAnotherTabActive(true);
    });
    return cleanup;
  }, []);

  // Inactivity & Background tab Auto-Lock
  useEffect(() => {
    if (!session) return;
    const cleanup = setupAutoLockEngine(() => {
      lockVault();
    }, 15);
    return cleanup;
  }, [session, lockVault]);

  // Sync recent Telegram channel media into local Dexie database
  const syncLibrary = useCallback(async () => {
    if (!session) return;
    setIsSyncing(true);
    try {
      const client = await getTelegramClient();
      const count = await syncRecentChannelMessages(client, session.channelId || 'me');
      console.info(`[Telegram Sync] Synced ${count} messages from channel.`);
    } catch (e) {
      console.warn('[Telegram Sync] Sync attempt skipped or failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, [session]);

  // Auto-sync on connect
  useEffect(() => {
    if (!session) return;

    let isMounted = true;
    (async () => {
      try {
        const client = await getTelegramClient();
        if (!isMounted) return;
        startChannelLiveListener(client, session.channelId || 'me');
        await syncRecentChannelMessages(client, session.channelId || 'me');
      } catch (e) {
        console.warn('[Telegram Auto-Sync] Initial channel sync deferred:', e);
      }
    })();

    const interval = setInterval(() => {
      syncLibrary();
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [session, syncLibrary]);

  // Theme Switching (Light, Dark, Midnight OLED)
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (t: ThemeMode) => {
      root.classList.remove('dark', 'light', 'midnight');
      if (t === 'midnight') {
        root.classList.add('dark', 'midnight');
      } else if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.add('light');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(isDark ? 'dark' : 'light');
      }
    };

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme('system');
      const handler = () => applyTheme('system');
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    localStorage.setItem('tg_photos_theme', t);
    setThemeState(t);
  };

  useEffect(() => {
    if (!session && !isVaultLocked) {
      const hasOnboarded = localStorage.getItem('framely_onboarding_completed');
      if (!hasOnboarded) {
        setIsOnboardingOpen(true);
      } else {
        setIsAuthModalOpen(true);
      }
    }
  }, [session, isVaultLocked]);

  useEffect(() => {
    const unsubscribe = transferQueue.subscribe((jobs) => {
      setActiveJobs(jobs.filter(j => j.status !== 'done'));
    });
    return unsubscribe;
  }, []);

  const setSession = (s: UserSession | null, passphrase?: string) => {
    if (s) {
      if (passphrase) {
        saveVaultSession(s, passphrase);
      } else {
        saveActiveSession(s);
      }
      setIsVaultLocked(false);
    } else {
      clearActiveSession();
    }
    setSessionState(s);
  };

  // Selection helpers
  const toggleSelectId = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllIds = (ids: number[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const uploadFiles = async (files: File[]) => {
    if (!session) {
      setIsAuthModalOpen(true);
      return;
    }
    let channelId = session.channelId;
    if (!channelId || !session.channelAccessHash) {
      try {
        const client = await getTelegramClient();
        const info = await ensureLibraryChannel(client);
        channelId = info.channelId;
      } catch (e) {
        console.warn('Could not auto-verify library channel, proceeding with session/Saved Messages:', e);
      }
    }
    await transferQueue.enqueueFiles(files, channelId || 'me');
  };

  const toggleFavorite = async (item: MediaItem) => {
    if (!item.messageId) return;
    const newFav = !item.isFavorite;
    await db.media.update(item.messageId, { isFavorite: newFav });
    if (selectedMedia?.messageId === item.messageId) {
      setSelectedMedia({ ...selectedMedia, isFavorite: newFav });
    }
  };

  const moveToTrash = async (item: MediaItem) => {
    if (!item.messageId) return;
    await db.media.update(item.messageId, { trashedAt: new Date().toISOString() });
    if (selectedMedia?.messageId === item.messageId) {
      setSelectedMedia(null);
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(item.messageId);
      return next;
    });
  };

  // Bulk Operations
  const bulkToggleFavorite = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const items = await db.media.where('messageId').anyOf(ids).toArray();
    for (const item of items) {
      await db.media.update(item.messageId, { isFavorite: !item.isFavorite });
    }
  };

  const bulkMoveToTrash = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    for (const id of ids) {
      await db.media.update(id, { trashedAt: now });
    }
    clearSelection();
  };

  const bulkDownloadZip = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const items = await db.media.where('messageId').anyOf(ids).toArray();
    const zip = new JSZip();

    for (const item of items) {
      if (item.thumbnailDataUrl) {
        const base64Data = item.thumbnailDataUrl.split(',')[1];
        if (base64Data) {
          zip.file(item.filename, base64Data, { base64: true });
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram_photos_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkAddToAlbum = async (albumName: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !albumName.trim()) return;

    for (const id of ids) {
      const item = await db.media.get(id);
      if (item) {
        const albums = item.albums || [];
        if (!albums.includes(albumName)) {
          albums.push(albumName);
          await db.media.update(id, { albums });
        }
      }
    }

    const existing = await db.albums.where('name').equals(albumName).first();
    if (!existing) {
      await db.albums.add({
        name: albumName,
        createdAt: new Date().toISOString(),
      });
    }

    clearSelection();
  };

  return (
    <AppContext.Provider
      value={{
        session,
        setSession,
        logout,
        panicWipe,
        isVaultLocked,
        unlockVault,
        lockVault,
        isAnotherTabActive,
        theme,
        setTheme,
        brandAccent,
        setBrandAccent,
        activeTab,
        setActiveTab,
        selectedMedia,
        setSelectedMedia,
        selectedIds,
        toggleSelectId,
        selectAllIds,
        clearSelection,
        gridDensity,
        setGridDensity,
        mediaFilter,
        setMediaFilter,
        sortOption,
        setSortOption,
        selectedAlbum,
        setSelectedAlbum,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        isDuplicatesOpen,
        setIsDuplicatesOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isPrivacyOpen,
        setIsPrivacyOpen,
        isShortcutsOpen,
        setIsShortcutsOpen,
        isRebuildModalOpen,
        setIsRebuildModalOpen,
        isStorageModalOpen,
        setIsStorageModalOpen,
        isTransfersOpen,
        setIsTransfersOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isNewAlbumOpen,
        setIsNewAlbumOpen,
        isSyncing,
        syncLibrary,
        activeJobs,
        uploadFiles,
        toggleFavorite,
        moveToTrash,
        searchQuery,
        setSearchQuery,
        bulkToggleFavorite,
        bulkMoveToTrash,
        bulkDownloadZip,
        bulkAddToAlbum,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
