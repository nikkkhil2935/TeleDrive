import React, { useMemo, useState } from 'react';
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
  ArrowUpDown
} from 'lucide-react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import type { MediaItem } from '../types';

export const TimelineView: React.FC = () => {
  const {
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
  } = useApp();

  const allMedia = useLiveQuery(
    async () => {
      try {
        let items = await db.media.toArray();

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
    [activeTab, mediaFilter, sortOption, selectedAlbum, searchQuery],
    []
  );

  // Group media by date label
  const groupedMedia = useMemo(() => {
    if (!allMedia) return [];
    const groups: { label: string; subLabel: string; items: MediaItem[] }[] = [];
    const map = new Map<string, MediaItem[]>();

    for (const item of allMedia) {
      const d = new Date(item.takenAt);
      const dateKey = isNaN(d.getTime()) ? 'Unknown Date' : d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(item);
    }

    map.forEach((items, label) => {
      groups.push({
        label,
        subLabel: `${items.length} ${items.length === 1 ? 'item' : 'items'}`,
        items,
      });
    });

    return groups;
  }, [allMedia]);

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

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col">
      {/* Sub-Header: Filter Chips, Sort, & Album Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          {selectedAlbum && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-semibold">
              <span>Album: {selectedAlbum}</span>
              <button onClick={() => setSelectedAlbum(null)} className="hover:text-sky-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Filter Chips */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setMediaFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                mediaFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Media
            </button>
            <button
              onClick={() => setMediaFilter('photo')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                mediaFilter === 'photo'
                  ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setMediaFilter('video')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
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
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500 font-medium cursor-pointer"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="size-desc">Largest First</option>
            <option value="size-asc">Smallest First</option>
            <option value="name-asc">Filename (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Floating Multi-Selection Action Bar (Google Photos Style) */}
      {isSelectionActive && (
        <div className="sticky top-0 z-30 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-150 border border-slate-700">
          <div className="flex items-center gap-4">
            <button
              onClick={clearSelection}
              className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold">
              {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
            </span>
            <button
              onClick={() => selectAllIds(allMedia.map(m => m.messageId))}
              className="text-xs text-sky-400 hover:underline"
            >
              Select All
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={bulkToggleFavorite}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
              title="Toggle Favorite"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              <span>Favorite</span>
            </button>

            <button
              onClick={bulkDownloadZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
              title="Download as ZIP"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download ZIP</span>
            </button>

            <button
              onClick={() => setIsNewAlbumOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors font-medium"
              title="Add to Album"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add to Album</span>
            </button>

            <button
              onClick={bulkMoveToTrash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors font-medium"
              title="Move to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash</span>
            </button>
          </div>
        </div>
      )}

      {/* Media Grid or Empty State */}
      {allMedia.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-sm">
            <ImageOff className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No media found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            {activeTab === 'photos'
              ? 'Upload photos or videos using the button above to build your Telegram library.'
              : `No items matching current filter in ${activeTab}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedMedia.map((group) => (
            <section key={group.label} className="space-y-3">
              {/* Date Header */}
              <div className="flex items-baseline gap-2.5 sticky top-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-2 z-10">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-500" />
                  <span>{group.label}</span>
                </h2>
                <span className="text-xs text-slate-400 dark:text-slate-500">{group.subLabel}</span>
              </div>

              {/* Dynamic Grid */}
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
                      className={`group relative aspect-square bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 ring-2 ring-sky-500 scale-[0.98]'
                          : 'border-slate-200 dark:border-slate-800/80 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10'
                      }`}
                    >
                      {item.thumbnailDataUrl ? (
                        <img
                          src={item.thumbnailDataUrl}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 text-slate-400 text-xs">
                          {item.filename}
                        </div>
                      )}

                      {/* Selection Checkbox (Google Photos Style Circle) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectId(item.messageId);
                        }}
                        className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center transition-all z-10 ${
                          isSelected
                            ? 'bg-sky-500 text-white shadow-md'
                            : 'bg-black/40 text-transparent hover:text-white border border-white/50 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 fill-current text-white" />
                      </button>

                      {/* Video Duration Badge */}
                      {item.kind === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{item.durationMs ? `${Math.round(item.durationMs / 1000)}s` : 'Video'}</span>
                        </div>
                      )}

                      {/* Favorite Heart Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item);
                        }}
                        className={`absolute bottom-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-all ${
                          item.isFavorite
                            ? 'bg-rose-500 text-white'
                            : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {/* Bottom Overlay Info */}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-[11px] text-white truncate font-medium">{item.filename}</div>
                        <div className="text-[10px] text-white/70">
                          {(item.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
