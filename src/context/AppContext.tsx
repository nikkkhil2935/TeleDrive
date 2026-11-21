import React, { createContext, useContext, useState, useEffect } from 'react';
import JSZip from 'jszip';
import type { MediaItem, UserSession, UploadJob } from '../types';
import { getActiveSession, saveActiveSession, clearActiveSession, ensureLibraryChannel, getTelegramClient } from '../services/tgClient';
import { transferQueue } from '../services/transferQueue';
import { db } from '../db';

export type ThemeMode = 'dark' | 'light' | 'system';
export type GridDensity = 'small' | 'medium' | 'large';
export type MediaFilter = 'all' | 'photo' | 'video';
export type SortOption = 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'name-asc';

interface AppContextType {
  session: UserSession | null;
  setSession: (s: UserSession | null) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
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
  const [session, setSessionState] = useState<UserSession | null>(getActiveSession());
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
  const [isRebuildModalOpen, setIsRebuildModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isTransfersOpen, setIsTransfersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewAlbumOpen, setIsNewAlbumOpen] = useState(false);

  const [activeJobs, setActiveJobs] = useState<UploadJob[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Theme switching
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    };

    if (theme === 'system') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mql.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  const setTheme = (t: ThemeMode) => {
    localStorage.setItem('tg_photos_theme', t);
    setThemeState(t);
  };

  useEffect(() => {
    if (!session) {
      setIsAuthModalOpen(true);
    }
  }, [session]);

  useEffect(() => {
    const unsubscribe = transferQueue.subscribe((jobs) => {
      setActiveJobs(jobs.filter(j => j.status !== 'done'));
    });
    return unsubscribe;
  }, []);

  const setSession = (s: UserSession | null) => {
    if (s) {
      saveActiveSession(s);
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

    // Ensure album exists in album table
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
        theme,
        setTheme,
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
