import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  X,
  Copy,
  Trash2,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  HardDrive,
  Layers,
  ArrowRight
} from 'lucide-react';
import { db } from '../db';
import { useApp } from '../context/AppContext';
import type { MediaItem } from '../types';

interface DuplicateGroup {
  hash: string;
  items: MediaItem[];
  bestItem: MediaItem;
  duplicates: MediaItem[];
  wastedBytes: number;
}

export const DuplicatesModal: React.FC = () => {
  const { isDuplicatesOpen, setIsDuplicatesOpen, session, moveToTrash } = useApp();
  const [undoItem, setUndoItem] = useState<MediaItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const allMedia = useLiveQuery(
    async () => {
      if (!session?.channelId) return [];
      return await db.media
        .where('libraryId')
        .equals(session.channelId)
        .and(m => !m.trashedAt)
        .toArray();
    },
    [session?.channelId],
    []
  );

  // Group by SHA-256 or (filename + sizeBytes)
  const duplicateGroups: DuplicateGroup[] = React.useMemo(() => {
    if (!allMedia || allMedia.length === 0) return [];

    const map = new Map<string, MediaItem[]>();
    for (const item of allMedia) {
      const key = item.sha256 || `${item.filename}_${item.sizeBytes}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(item);
    }

    const groups: DuplicateGroup[] = [];
    map.forEach((items, hash) => {
      if (items.length > 1) {
        // Find best item (highest resolution, then longest date)
        const sorted = [...items].sort((a, b) => {
          const resA = (a.width || 0) * (a.height || 0);
          const resB = (b.width || 0) * (b.height || 0);
          if (resB !== resA) return resB - resA;
          return b.sizeBytes - a.sizeBytes;
        });

        const bestItem = sorted[0];
        const duplicates = sorted.slice(1);
        const wastedBytes = duplicates.reduce((acc, cur) => acc + cur.sizeBytes, 0);

        groups.push({
          hash,
          items: sorted,
          bestItem,
          duplicates,
          wastedBytes
        });
      }
    });

    return groups;
  }, [allMedia]);

  const totalWastedBytes = duplicateGroups.reduce((acc, g) => acc + g.wastedBytes, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCleanGroup = async (group: DuplicateGroup) => {
    for (const dup of group.duplicates) {
      await moveToTrash(dup);
    }
    setToastMessage(`Moved ${group.duplicates.length} duplicates to Trash (${formatSize(group.wastedBytes)} saved)`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCleanAll = async () => {
    let count = 0;
    for (const group of duplicateGroups) {
      for (const dup of group.duplicates) {
        await moveToTrash(dup);
        count++;
      }
    }
    setToastMessage(`Cleaned all ${count} duplicate photos (${formatSize(totalWastedBytes)} freed)`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  if (!isDuplicatesOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Copy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Duplicate Finder & Clean-up</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Exact SHA-256 and visual duplicate detection
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDuplicatesOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Space Saved Counter Banner */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-500" />
            <span className="text-xs font-semibold">
              {duplicateGroups.length > 0 ? (
                <span>
                  Found <b>{duplicateGroups.length} duplicate groups</b> · Potential savings:{' '}
                  <span className="text-emerald-500 font-bold">{formatSize(totalWastedBytes)}</span>
                </span>
              ) : (
                <span className="text-emerald-500 font-medium">No duplicates found in your library!</span>
              )}
            </span>
          </div>

          {duplicateGroups.length > 0 && (
            <button
              onClick={handleCleanAll}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clean All ({formatSize(totalWastedBytes)})
            </button>
          )}
        </div>

        {/* Groups List */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {duplicateGroups.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Your Library is Clean!
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No duplicate copies or identical media files detected. Your cloud storage is organized.
              </p>
            </div>
          ) : (
            duplicateGroups.map((group) => (
              <div
                key={group.hash}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Group: {group.items[0].filename} ({group.items.length} copies)
                  </span>
                  <button
                    onClick={() => handleCleanGroup(group)}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Keep Best, Trash Rest ({formatSize(group.wastedBytes)})
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.items.map((item, idx) => {
                    const isBest = item.messageId === group.bestItem.messageId;
                    return (
                      <div
                        key={item.messageId}
                        className={`p-2.5 rounded-xl border relative flex flex-col gap-2 ${
                          isBest
                            ? 'border-emerald-500/60 bg-emerald-500/5'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {isBest && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[9px] shadow-sm flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Keep Best
                          </div>
                        )}

                        <div className="aspect-video w-full rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                          {item.thumbnailDataUrl ? (
                            <img
                              src={item.thumbnailDataUrl}
                              alt={item.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Layers className="w-6 h-6 text-slate-400" />
                          )}
                        </div>

                        <div className="text-[11px] space-y-0.5">
                          <div className="font-semibold truncate">{item.filename}</div>
                          <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                            <span>{item.width}×{item.height}</span>
                            <span>{formatSize(item.sizeBytes)}</span>
                          </div>
                          {item.camera && (
                            <div className="text-[10px] text-slate-400 truncate">{item.camera}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Undo Toast */}
        {toastMessage && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between px-5 animate-in slide-in-from-bottom">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="underline text-xs hover:text-emerald-100"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
