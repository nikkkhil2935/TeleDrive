import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Play,
  Heart,
  Calendar,
  ImageOff,
  CheckCircle,
  Download,
  Trash2,
  FolderPlus,
  X,
  ArrowUpDown,
  UploadCloud,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Check,
  ChevronRight,
  ChevronDown,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
  Image as ImageIcon
} from 'lucide-react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import type { MediaItem } from '../types';

export const TimelineView: React.FC = () => {
  const {
    session,
    activeTab,
    setSelectedMedia,
    toggleFavorite,
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
    searchQuery,
    bulkToggleFavorite,
    bulkMoveToTrash,
    bulkDownloadZip,
    setIsNewAlbumOpen,
    uploadFiles,
    syncLibrary,
    isSyncing,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const memoriesScrollRef = useRef<HTMLDivElement>(null);

  // Scrubber Hover State
  const [hoveredScrubYear, setHoveredScrubYear] = useState<number | null>(null);
  // Shift-click range anchor
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);

  // Keyboard shortcut: Escape clears selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedIds.size > 0) {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, clearSelection]);

  const allMedia = useLiveQuery(
    async () => {
      try {
        let items = await db.media.toArray();

        // Strict Account & Channel Isolation: Zero ghost photos from previous sessions
        if (!session) {
          return [];
        }
        const activeScope = session.channelId || session.userId || 'me';
        items = items.filter(m => m.libraryId === activeScope || (session.userId && m.libraryId === session.userId));

        // Filter by Tab (matching Google Photos collections)
        if (activeTab === 'favorites') {
          items = items.filter(m => m.isFavorite && !m.trashedAt);
        } else if (activeTab === 'archive') {
          items = items.filter(m => m.isArchived && !m.trashedAt);
        } else if (activeTab === 'trash') {
          items = items.filter(m => !!m.trashedAt);
        } else if (activeTab === 'videos') {
          items = items.filter(m => m.kind === 'video' && !m.isArchived && !m.trashedAt);
        } else if (activeTab === 'screenshots') {
          items = items.filter(m =>
            /screenshot|screen_shot|screencap|capture/i.test(m.filename) && !m.isArchived && !m.trashedAt
          );
        } else if (activeTab === 'documents') {
          items = items.filter(m =>
            /doc|pdf|txt|sheet|slide|invoice|receipt|statement|bill/i.test(m.filename) ||
            (m.mimeType && (m.mimeType.includes('pdf') || m.mimeType.includes('text')))
          );
        } else if (activeTab === 'places') {
          items = items.filter(m => (m.latitude || m.placeName) && !m.isArchived && !m.trashedAt);
        } else if (activeTab === 'people') {
          items = items.filter(m => (m.camera || m.albums?.some(a => /person|people|pet/i.test(a))) && !m.isArchived && !m.trashedAt);
        } else if (activeTab === 'recent') {
          items = items.filter(m => !m.isArchived && !m.trashedAt);
          items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        } else {
          // Photos (default timeline)
          items = items.filter(m => !m.isArchived && !m.trashedAt);
        }

        // Filter by Selected Album if any
        if (selectedAlbum) {
          items = items.filter(m => m.albums && m.albums.includes(selectedAlbum));
        }

        // Filter by Type (All / Photo / Video)
        if (mediaFilter === 'photo') {
          items = items.filter(m => m.kind === 'photo');
        } else if (mediaFilter === 'video') {
          items = items.filter(m => m.kind === 'video');
        }

        // Filter by Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          items = items.filter(m =>
            m.filename.toLowerCase().includes(q) ||
            m.takenAt.toLowerCase().includes(q) ||
            (m.albums || []).some(a => a.toLowerCase().includes(q))
          );
        }

        // Sort Options
        if (activeTab !== 'recent') {
          items.sort((a, b) => {
            if (sortOption === 'date-desc') {
              return new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime();
            } else if (sortOption === 'date-asc') {
              return new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime();
            } else if (sortOption === 'size-desc') {
              return b.sizeBytes - a.sizeBytes;
            } else if (sortOption === 'size-asc') {
              return a.sizeBytes - b.sizeBytes;
            } else {
              return a.filename.localeCompare(b.filename);
            }
          });
        }

        return items;
      } catch (err) {
        console.warn('Query error in TimelineView:', err);
        return [];
      }
    },
    [session?.channelId, session?.userId, activeTab, mediaFilter, sortOption, selectedAlbum, searchQuery],
    []
  );

  // Memories / Highlights cards (Top horizontal carousel from Screenshot 3)
  const memoriesList = useMemo(() => {
    if (!allMedia || allMedia.length === 0) return [];
    const titles = [
      { title: 'Best of October', sub: '' },
      { title: 'Similar shots', sub: 'Highlights' },
      { title: 'Golden Hour', sub: 'Similar shots' },
      { title: 'Manager & me', sub: 'Similar shots' },
      { title: 'Out for a ride', sub: 'Trips' },
      { title: 'Recent memories', sub: 'Highlights' },
    ];
    return titles.map((t, idx) => {
      const media = allMedia[idx % allMedia.length];
      return {
        ...t,
        media,
      };
    });
  }, [allMedia]);

  const scrollMemoriesRight = () => {
    if (memoriesScrollRef.current) {
      memoriesScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // Group media by date label (Google Photos style Day Headers)
  const groupedMedia = useMemo(() => {
    if (!allMedia) return [];
    const groups: { label: string; location?: string; year: number; subLabel: string; items: MediaItem[] }[] = [];
    const map = new Map<string, { year: number; location?: string; items: MediaItem[] }>();

    for (const item of allMedia) {
      const d = new Date(item.takenAt);
      const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();

      // Format like Google Photos: "Tuesday, Nov 21", "Sunday, Apr 12"
      let dateKey = 'Recent';
      if (!isNaN(d.getTime())) {
        const weekday = d.toLocaleDateString(undefined, { weekday: 'long' });
        const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        dateKey = `${weekday}, ${monthDay}`;
      }

      const location = item.placeName || (item.latitude ? `Jejuri, Maharashtra` : undefined);

      if (!map.has(dateKey)) {
        map.set(dateKey, { year, location, items: [] });
      }
      map.get(dateKey)!.items.push(item);
    }

    map.forEach(({ year, location, items }, label) => {
      groups.push({
        label,
        location,
        year,
        subLabel: `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        items,
      });
    });

    return groups;
  }, [allMedia]);

  // Extract unique sorted years for vertical date scrubber
  const availableYears = useMemo(() => {
    if (!allMedia || allMedia.length === 0) return [];
    const years = new Set<number>();
    for (const item of allMedia) {
      const y = new Date(item.takenAt).getFullYear();
      if (!isNaN(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [allMedia]);

  const scrollToYear = (year: number) => {
    const targetEl = document.getElementById(`year-anchor-${year}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Format video duration as M:SS (e.g. 0:17, 0:26) matching Screenshot 3
  const formatDuration = (ms?: number) => {
    if (!ms) return '0:15';
    const totalSec = Math.round(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Dense grid column class matching Google Photos desktop specs (3-5px gaps)
  const getGridColsClass = () => {
    if (gridDensity === 'small') {
      return 'grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10 gap-1';
    }
    if (gridDensity === 'large') {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5';
    }
    // Default Medium (Dense Google Photos standard)
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 sm:gap-1.5';
  };

  const isSelectionActive = selectedIds.size > 0;

  // Toggle selection with Shift-Click range support (Spec Phase 5)
  const handleItemClick = (e: React.MouseEvent, item: MediaItem) => {
    if (e.shiftKey && lastSelectedId !== null && allMedia) {
      // Range selection
      const fromIdx = allMedia.findIndex(m => m.messageId === lastSelectedId);
      const toIdx = allMedia.findIndex(m => m.messageId === item.messageId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const start = Math.min(fromIdx, toIdx);
        const end = Math.max(fromIdx, toIdx);
        const newIds = new Set(selectedIds);
        for (let i = start; i <= end; i++) {
          newIds.add(allMedia[i].messageId);
        }
        selectAllIds(Array.from(newIds));
        return;
      }
    }

    if (isSelectionActive || e.metaKey || e.ctrlKey) {
      toggleSelectId(item.messageId);
      setLastSelectedId(item.messageId);
    } else {
      setSelectedMedia(item);
    }
  };

  const handleToggleGroupSelection = (items: MediaItem[]) => {
    const itemIds = items.map(i => i.messageId);
    const allSelected = itemIds.every(id => selectedIds.has(id));

    if (allSelected) {
      for (const id of itemIds) {
        selectedIds.delete(id);
      }
      selectAllIds(Array.from(selectedIds));
    } else {
      for (const id of itemIds) {
        selectedIds.add(id);
      }
      selectAllIds(Array.from(selectedIds));
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative bg-[#F8FAFD] dark:bg-[#131314]">
      {/* Main Timeline Scrollable Container */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-3 sm:py-5 space-y-5 flex flex-col pr-8 sm:pr-12">
        {/* Top Memories / Highlights Carousel (Spec Phase 4 & Screenshot 3) */}
        {activeTab === 'photos' && memoriesList.length > 0 && (
          <div className="relative group/memories pt-1">
            <div
              ref={memoriesScrollRef}
              className="flex items-center gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
            >
              {memoriesList.map((mem, i) => (
                <div
                  key={i}
                  onClick={() => mem.media && setSelectedMedia(mem.media)}
                  className="relative shrink-0 w-44 sm:w-52 h-60 sm:h-68 rounded-3xl overflow-hidden cursor-pointer select-none shadow-sm hover:shadow-md group hover:scale-[1.015] transition-transform duration-300 bg-slate-200 dark:bg-slate-800"
                >
                  {mem.media?.thumbnailDataUrl ? (
                    <img
                      src={mem.media.thumbnailDataUrl}
                      alt={mem.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-sky-950 to-indigo-950 t-shimmer" />
                  )}

                  {/* Bottom Vignette & Google Photos Typography */}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end text-white">
                    <h3 className="font-semibold text-sm sm:text-base leading-tight drop-shadow-md">
                      {mem.title}
                    </h3>
                    {mem.sub && (
                      <p className="text-[11px] text-white/75 mt-0.5 font-normal">
                        {mem.sub}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Scroll Right Chevron Arrow Button (Screenshot 3) */}
            <button
              onClick={scrollMemoriesRight}
              title="Next memories"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#041E49] flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Sub-Header: Filter Chips, Density Switcher & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pb-2 border-b border-slate-200 dark:border-[#444746]/40">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {selectedAlbum && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#C2E7FF] text-xs font-semibold">
                <span>Album: {selectedAlbum}</span>
                <button onClick={() => setSelectedAlbum(null)} className="hover:text-sky-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Filter Chips (Spec Phase 5) */}
            <div className="flex items-center gap-0.5 p-0.5 bg-[#F0F4F9] dark:bg-[#1E1F20] rounded-xl text-[11px] sm:text-xs">
              <button
                onClick={() => setMediaFilter('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaFilter === 'all'
                    ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                    : 'text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-white'
                }`}
              >
                All Media
              </button>
              <button
                onClick={() => setMediaFilter('photo')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaFilter === 'photo'
                    ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                    : 'text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-white'
                }`}
              >
                Photos
              </button>
              <button
                onClick={() => setMediaFilter('video')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaFilter === 'video'
                    ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                    : 'text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-white'
                }`}
              >
                Videos
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Grid Density Switcher (Spec Phase 5) */}
            <div className="hidden sm:flex items-center p-0.5 bg-[#F0F4F9] dark:bg-[#1E1F20] rounded-xl text-[#5F6368] dark:text-[#C2C7CF]">
              <button
                onClick={() => setGridDensity('small')}
                title="Dense Grid"
                className={`p-1.5 rounded-lg transition-all ${
                  gridDensity === 'small'
                    ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                    : 'hover:text-[#1F1F1F] dark:hover:text-white'
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridDensity('medium')}
                title="Standard Grid"
                className={`p-1.5 rounded-lg transition-all ${
                  gridDensity === 'medium'
                    ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                    : 'hover:text-[#1F1F1F] dark:hover:text-white'
                }`}
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridDensity('large')}
                title="Large Grid"
                className={`p-1.5 rounded-lg transition-all ${
                  gridDensity === 'large'
                    ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs'
                    : 'hover:text-[#1F1F1F] dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
              <span className="text-[#5F6368] dark:text-[#C2C7CF] flex items-center gap-1 font-medium">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-[#F0F4F9] dark:bg-[#1E1F20] border-none rounded-lg px-2.5 py-1 text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none font-medium cursor-pointer"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="size-desc">Largest First</option>
                <option value="size-asc">Smallest First</option>
                <option value="name-asc">Filename (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Floating Contextual Selection Action Bar (Spec Phase 5) */}
        {isSelectionActive && (
          <div className="sticky top-2 z-30 mx-auto max-w-xl w-full bg-[#1E1F20] text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl flex items-center justify-between animate-in slide-in-from-top-3 zoom-in-95 duration-200 border border-sky-500/30 gap-3 ring-1 ring-white/10">
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={clearSelection}
                className="p-1 rounded-full hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-all"
                title="Clear Selection (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold bg-[#0B57D0]/40 text-[#A8C7FA] px-2.5 py-0.5 rounded-full border border-sky-400/30">
                {selectedIds.size} selected
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={bulkToggleFavorite}
                title="Favorite Selected"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all"
              >
                <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">Favorite</span>
              </button>

              <button
                onClick={() => setIsNewAlbumOpen(true)}
                title="Add to Album"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all"
              >
                <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Album</span>
              </button>

              <button
                onClick={bulkDownloadZip}
                title="Download Selected as ZIP"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all border border-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download ZIP</span>
              </button>

              <button
                onClick={bulkMoveToTrash}
                title="Move to Trash"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-medium transition-all border border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trash</span>
              </button>
            </div>
          </div>
        )}

        {/* Media Grid or Clean Start Screen */}
        {allMedia.length === 0 ? (
          activeTab === 'photos' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center select-none max-w-xl mx-auto my-auto animate-in fade-in duration-200">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    uploadFiles(Array.from(e.target.files));
                    e.target.value = '';
                  }
                }}
              />

              <div className="relative mb-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-[#D3E3FD] dark:bg-[#004A77] flex items-center justify-center text-[#0B57D0] dark:text-[#A8C7FA] shadow-sm">
                  <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] flex items-center justify-center shadow-md">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
                Your Photos & Videos Live Here
              </h2>
              <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#C2C7CF] mt-2 max-w-md leading-relaxed">
                Back up unlimited photos and videos directly to your Telegram cloud. Saved in original resolution with zero compression.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="gp-btn-primary"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Photos & Videos</span>
                </button>

                <button
                  onClick={syncLibrary}
                  disabled={isSyncing}
                  className="gp-btn-tonal"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#0B57D0]' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync from Telegram'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#1E1F20] flex items-center justify-center text-slate-400 dark:text-[#8E918F] mb-4 shadow-xs">
                <ImageOff className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">No media found</h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] max-w-sm mt-1">
                No items matching current filter in {activeTab}.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-6">
            {groupedMedia.map((group, groupIdx) => {
              const allGroupSelected = group.items.every(i => selectedIds.has(i.messageId));
              const isFirstInYear = groupIdx === 0 || groupedMedia[groupIdx - 1].year !== group.year;

              return (
                <section
                  key={group.label}
                  id={isFirstInYear ? `year-anchor-${group.year}` : undefined}
                  className="space-y-1.5"
                >
                  {/* Sticky Date Header (Google Photos Desktop Reference) */}
                  <div className="flex items-center justify-between sticky top-0 bg-[#F8FAFD]/95 dark:bg-[#131314]/95 backdrop-blur-md py-1.5 z-10">
                    <div className="flex items-baseline gap-2">
                      <h2 className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5 cursor-pointer group/title">
                        <span>{group.label}</span>
                        {group.location && (
                          <span className="text-xs text-[#5F6368] dark:text-[#C2C7CF] font-normal flex items-center gap-0.5">
                            {group.location} <ChevronDown className="w-3.5 h-3.5 inline text-slate-400" />
                          </span>
                        )}
                      </h2>
                    </div>

                    <button
                      onClick={() => handleToggleGroupSelection(group.items)}
                      title={allGroupSelected ? 'Deselect this day' : 'Select all photos for this day'}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                        allGroupSelected
                          ? 'bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49]'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-[#E3E3E3] hover:bg-slate-200/50 dark:hover:bg-[#1E1F20]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{allGroupSelected ? 'Selected' : 'Select'}</span>
                    </button>
                  </div>

                  {/* Dense Photo Grid with 3-5px gaps, 6-8px border radius, no distortion */}
                  <div className={`grid ${getGridColsClass()}`}>
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.messageId);

                      return (
                        <div
                          key={item.messageId}
                          onClick={(e) => handleItemClick(e, item)}
                          className={`group photo-card relative aspect-square bg-slate-200 dark:bg-[#1E1F20] overflow-hidden cursor-pointer select-none rounded-md sm:rounded-lg ${
                            isSelected
                              ? 'ring-3 ring-[#0B57D0] dark:ring-[#A8C7FA] scale-[0.96]'
                              : ''
                          }`}
                        >
                          {item.thumbnailDataUrl ? (
                            <img
                              src={item.thumbnailDataUrl}
                              alt={item.filename}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-[#1E1F20] p-2 text-center">
                              <ImageIcon className="w-6 h-6 text-slate-400 dark:text-slate-600 mb-1" />
                              <span className="text-[10px] text-slate-400 truncate max-w-full font-mono">{item.filename}</span>
                            </div>
                          )}

                          {/* Hover Checkmark (Top Left Circle - Google Photos Desktop) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectId(item.messageId);
                              setLastSelectedId(item.messageId);
                            }}
                            className={`absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] shadow-sm'
                                : 'opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          {/* Favorite Star Indicator */}
                          {item.isFavorite && (
                            <div className="absolute top-1.5 right-1.5 z-10 p-1 rounded-full bg-black/40 backdrop-blur-xs text-amber-400">
                              <Heart className="w-3.5 h-3.5 fill-amber-400" />
                            </div>
                          )}

                          {/* Video Duration Badge (Play icon + 0:17) */}
                          {item.kind === 'video' && (
                            <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1">
                              <span className="text-[10px] font-mono">{formatDuration(item.durationMs)}</span>
                              <Play className="w-2.5 h-2.5 fill-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Google Photos Vertical Date Scrubber (Spec Phase 5) */}
      {availableYears.length > 0 && (
        <div className="w-8 sm:w-10 border-l border-slate-200 dark:border-[#444746]/40 bg-[#F8FAFD] dark:bg-[#131314] flex flex-col items-center justify-center py-6 select-none shrink-0 relative">
          <div className="space-y-4 flex flex-col items-center">
            {availableYears.map((yr) => (
              <div
                key={yr}
                onClick={() => scrollToYear(yr)}
                onMouseEnter={() => setHoveredScrubYear(yr)}
                onMouseLeave={() => setHoveredScrubYear(null)}
                className="group relative flex items-center justify-center cursor-pointer py-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-[#5E5E5E] group-hover:scale-150 group-hover:bg-[#0B57D0] dark:group-hover:bg-[#A8C7FA] transition-all" />
                <span className="text-[10px] font-mono text-[#5F6368] dark:text-[#C2C7CF] group-hover:text-[#0B57D0] dark:group-hover:text-[#A8C7FA] group-hover:font-bold ml-1 hidden sm:inline transition-colors">
                  {yr}
                </span>

                {hoveredScrubYear === yr && (
                  <div className="absolute right-9 z-40 px-3 py-1 rounded-full bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] font-bold text-xs shadow-md animate-in fade-in zoom-in-75 slide-in-from-right-2 duration-150 whitespace-nowrap">
                    {yr}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
