import React, { useMemo, useState, useRef } from 'react';
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
  Filter,
  ArrowUpDown,
  UploadCloud,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Sparkles,
  Check,
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
    setIsRebuildModalOpen,
    syncLibrary,
    isSyncing,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scrubber Hover State
  const [hoveredScrubYear, setHoveredScrubYear] = useState<number | null>(null);

  const allMedia = useLiveQuery(
    async () => {
      try {
        let items = await db.media.toArray();

        // Security & Account Isolation: Scoped strictly to current authenticated Telegram channel / account
        if (session?.channelId) {
          items = items.filter(m => m.libraryId === session.channelId || (session.userId && m.libraryId === session.userId));
        } else if (!session) {
          return []; // If not logged in, show ZERO photos
        }

        // Filter by Tab
        if (activeTab === 'favorites') {
          items = items.filter(m => m.isFavorite && !m.trashedAt);
        } else if (activeTab === 'archive') {
          items = items.filter(m => m.isArchived && !m.trashedAt);
        } else if (activeTab === 'trash') {
          items = items.filter(m => !!m.trashedAt);
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
            m.albums.some(a => a.toLowerCase().includes(q))
          );
        }

        // Sort Options
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

        return items;
      } catch (err) {
        console.warn('Query error in TimelineView:', err);
        return [];
      }
    },
    [session?.channelId, activeTab, mediaFilter, sortOption, selectedAlbum, searchQuery],
    []
  );

  // Group media by date label
  const groupedMedia = useMemo(() => {
    if (!allMedia) return [];
    const groups: { label: string; year: number; subLabel: string; items: MediaItem[] }[] = [];
    const map = new Map<string, { year: number; items: MediaItem[] }>();

    for (const item of allMedia) {
      const d = new Date(item.takenAt);
      const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
      const dateKey = isNaN(d.getTime()) ? 'Unknown Date' : d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!map.has(dateKey)) {
        map.set(dateKey, { year, items: [] });
      }
      map.get(dateKey)!.items.push(item);
    }

    map.forEach(({ year, items }, label) => {
      groups.push({
        label,
        year,
        subLabel: `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        items,
      });
    });

    return groups;
  }, [allMedia]);

  // Extract unique sorted years for vertical date scrubber (§2.2, §5)
  const availableYears = useMemo(() => {
    if (!allMedia || allMedia.length === 0) return [];
    const years = new Set<number>();
    for (const item of allMedia) {
      const y = new Date(item.takenAt).getFullYear();
      if (!isNaN(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [allMedia]);

  // Jump to specific year via scrubber
  const scrollToYear = (year: number) => {
    const targetEl = document.getElementById(`year-anchor-${year}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Determine grid column class from density
  const getGridColsClass = () => {
    if (gridDensity === 'small') {
      return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-1.5';
    }
    if (gridDensity === 'large') {
      return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';
    }
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5';
  };

  const isSelectionActive = selectedIds.size > 0;

  // Toggle selection for all items in a date group
  const handleToggleGroupSelection = (items: MediaItem[]) => {
    const itemIds = items.map(i => i.messageId);
    const allSelected = itemIds.every(id => selectedIds.has(id));

    if (allSelected) {
      // Unselect all in this group
      for (const id of itemIds) {
        selectedIds.delete(id);
      }
      selectAllIds(Array.from(selectedIds));
    } else {
      // Select all in this group
      for (const id of itemIds) {
        selectedIds.add(id);
      }
      selectAllIds(Array.from(selectedIds));
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Main Timeline Scrollable Container */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 flex flex-col pr-8 sm:pr-12">
        {/* Sub-Header: Filter Chips, Sort, & Album Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {selectedAlbum && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                <span>Album: {selectedAlbum}</span>
                <button onClick={() => setSelectedAlbum(null)} className="hover:text-sky-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Filter Chips (§2.4, §8.1) */}
            <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs">
              <button
                onClick={() => setMediaFilter('all')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Media
              </button>
              <button
                onClick={() => setMediaFilter('photo')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaFilter === 'photo'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Photos
              </button>
              <button
                onClick={() => setMediaFilter('video')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaFilter === 'video'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Videos
              </button>
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 sm:px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
              <option value="name-asc">Filename (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Floating Multi-Selection Action Bar (Apple & Google Photos Dynamic Island Pill) */}
        {isSelectionActive && (
          <div className="sticky top-2 z-30 mx-auto max-w-xl w-full bg-slate-900/95 dark:bg-slate-900/95 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-2xl backdrop-blur-xl flex items-center justify-between animate-in slide-in-from-top-3 zoom-in-95 duration-200 border border-sky-500/30 gap-3 ring-1 ring-white/10">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={clearSelection}
                className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 text-slate-400 hover:text-white transition-all"
                title="Clear Selection"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
              <span className="text-xs font-bold tracking-tight bg-sky-500/20 text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-500/30">
                {selectedIds.size} <span className="hidden xs:inline">selected</span>
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={bulkToggleFavorite}
                title="Favorite Selected"
                className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all"
              >
                <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="hidden sm:inline">Favorite</span>
              </button>

              <button
                onClick={() => setIsNewAlbumOpen(true)}
                title="Add to Album"
                className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all"
              >
                <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Album</span>
              </button>

              <button
                onClick={bulkDownloadZip}
                title="Download Selected as ZIP"
                className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all border border-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download ZIP</span>
              </button>

              <button
                onClick={bulkMoveToTrash}
                title="Move to Trash"
                className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-medium transition-all border border-rose-500/20"
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
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-12 text-center select-none max-w-xl mx-auto my-auto animate-in fade-in duration-200">
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
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-500/20 via-indigo-500/15 to-purple-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shadow-xl shadow-sky-500/10">
                  <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Your Photos & Videos Live Here
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md leading-relaxed">
                Back up unlimited photos and videos directly to your Telegram cloud. Saved in original resolution with zero compression.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Photos & Videos</span>
                </button>

                <button
                  onClick={syncLibrary}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-500' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync from Telegram'}</span>
                </button>
              </div>

              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-10 w-full text-left">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <div className="flex items-center gap-2 text-sky-500 font-semibold text-xs mb-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Original Quality</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Files up to 2 GB with pixel-perfect byte fidelity.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-500 font-semibold text-xs mb-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Direct MTProto</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Direct client-to-Telegram WebSocket connection.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-500 font-semibold text-xs mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Smart EXIF</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    Auto-extracted capture dates, specs & GPS tags.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-sm">
                <ImageOff className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No media found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                No items matching current filter in {activeTab}.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-8">
            {groupedMedia.map((group, groupIdx) => {
              const allGroupSelected = group.items.every(i => selectedIds.has(i.messageId));

              return (
                <section key={group.label} id={`year-anchor-${group.year}`} className="space-y-3">
                  {/* Sticky Date Header with Select Day Circle Affordance */}
                  <div className="flex items-center justify-between sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2.5 z-10 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-baseline gap-2.5">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-sky-500" />
                        <span>{group.label}</span>
                      </h2>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{group.subLabel}</span>
                    </div>

                    <button
                      onClick={() => handleToggleGroupSelection(group.items)}
                      title={allGroupSelected ? 'Deselect this day' : 'Select all photos for this day'}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                        allGroupSelected
                          ? 'bg-sky-500 text-white'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{allGroupSelected ? 'Selected' : 'Select day'}</span>
                    </button>
                  </div>

                  {/* Dynamic Grid with exact aspect ratios & zero gray boxes */}
                  <div className={`grid ${getGridColsClass()}`}>
                    {group.items.map((item) => {
                      const isSelected = selectedIds.has(item.messageId);

                      return (
                        <div
                          key={item.messageId}
                          onClick={() => {
                            if (isSelectionActive) {
                              toggleSelectId(item.messageId);
                            } else {
                              setSelectedMedia(item);
                            }
                          }}
                          className={`group photo-card relative aspect-square bg-gradient-to-tr from-slate-200/70 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl overflow-hidden border cursor-pointer ${
                            isSelected
                              ? 'border-sky-500 ring-4 ring-sky-500/30 scale-[0.97]'
                              : 'border-slate-200/80 dark:border-white/5 hover:border-sky-500/40'
                          }`}
                        >
                          {item.thumbnailDataUrl ? (
                            <img
                              src={item.thumbnailDataUrl}
                              alt={item.filename}
                              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 p-2 text-center">
                              <ImageIcon className="w-6 h-6 text-sky-400 opacity-60 mb-1" />
                              <span className="text-[10px] text-slate-500 truncate max-w-full font-mono">{item.filename}</span>
                            </div>
                          )}

                          {/* Selection Checkbox (Google Photos Style Circle) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectId(item.messageId);
                            }}
                            className={`absolute top-2 left-2 z-10 p-1 rounded-full transition-all duration-150 ${
                              isSelected
                                ? 'bg-sky-500 text-white shadow-md'
                                : 'opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-sm'
                            }`}
                          >
                            <CheckCircle className={`w-4 h-4 ${isSelected ? 'fill-sky-500 text-white' : ''}`} />
                          </button>

                          {/* Favorite Pill Indicator */}
                          {item.isFavorite && (
                            <div className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/40 backdrop-blur-sm text-amber-400">
                              <Heart className="w-3.5 h-3.5 fill-amber-400" />
                            </div>
                          )}

                          {/* Video Badge */}
                          {item.kind === 'video' && (
                            <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] flex items-center gap-1 font-medium">
                              <Play className="w-2.5 h-2.5 fill-white" />
                              {item.durationMs ? `${Math.round(item.durationMs / 1000)}s` : 'Video'}
                            </div>
                          )}

                          {/* Hover Bottom Shade */}
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white text-[10px]">
                            <span className="truncate max-w-[70%]">{item.filename}</span>
                            <span>{(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                          </div>
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

      {/* Google Photos Style Vertical Date Scrubber Bar (§2.2, §5) */}
      {availableYears.length > 0 && (
        <div className="w-8 sm:w-10 border-l border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col items-center justify-center py-6 select-none shrink-0 relative">
          <div className="space-y-4 flex flex-col items-center">
            {availableYears.map((yr) => (
              <div
                key={yr}
                onClick={() => scrollToYear(yr)}
                onMouseEnter={() => setHoveredScrubYear(yr)}
                onMouseLeave={() => setHoveredScrubYear(null)}
                className="group relative flex items-center justify-center cursor-pointer py-1"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600 group-hover:scale-150 group-hover:bg-sky-500 transition-all" />
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 group-hover:text-sky-500 group-hover:font-bold ml-1 hidden sm:inline transition-colors">
                  {yr}
                </span>

                {/* Floating Year Pill on Hover/Drag with elastic pop-in */}
                {hoveredScrubYear === yr && (
                  <div className="absolute right-9 z-40 px-3.5 py-1.5 rounded-full bg-sky-500 text-white font-bold text-xs shadow-xl shadow-sky-500/30 animate-in fade-in zoom-in-75 slide-in-from-right-2 duration-150 whitespace-nowrap ring-2 ring-white/20">
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
