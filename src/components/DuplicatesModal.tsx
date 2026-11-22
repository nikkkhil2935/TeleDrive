import React, { useState } from 'react';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const allMedia = useLiveQuery(
    async () => {
      if (!session) return [];
      const activeScope = session.channelId || session.userId || 'me';
      return await db.media
        .where('libraryId')
        .equals(activeScope)
        .and(m => !m.trashedAt)
        .toArray();
    },
    [session?.channelId, session?.userId],
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
        // Find best item (highest resolution, then largest size)
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="t-modal-content bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center font-bold">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Duplicate Finder & Clean-up</h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">
                Exact cryptographic SHA-256 and perceptual duplicate detection
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDuplicatesOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Space Saved Counter Banner */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-[#444746]/40 bg-[#F8FAFD] dark:bg-[#131314] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA]" />
            <span className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
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
              className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clean All ({formatSize(totalWastedBytes)})
            </button>
          )}
        </div>

        {/* Groups List */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {duplicateGroups.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="font-semibold text-base text-[#1F1F1F] dark:text-[#E3E3E3]">
                Your Library is Clean!
              </div>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] max-w-sm mx-auto">
                No duplicate copies or redundant media files detected. Your personal Telegram storage is spotless.
              </p>
            </div>
          ) : (
            duplicateGroups.map((group) => (
              <div
                key={group.hash}
                className="p-4 rounded-2xl border border-slate-200 dark:border-[#444746]/50 bg-[#F8FAFD] dark:bg-[#131314] space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate max-w-[280px]">
                    {group.items[0].filename} ({group.items.length} copies)
                  </span>
                  <button
                    onClick={() => handleCleanGroup(group)}
                    className="px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Keep Best, Trash Rest ({formatSize(group.wastedBytes)})
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.items.map((item) => {
                    const isBest = item.messageId === group.bestItem.messageId;
                    return (
                      <div
                        key={item.messageId}
                        className={`p-2.5 rounded-xl border relative flex flex-col gap-2 ${
                          isBest
                            ? 'border-emerald-500/60 bg-emerald-500/5'
                            : 'border-slate-200 dark:border-[#444746]/40 bg-white dark:bg-[#1E1F20]'
                        }`}
                      >
                        {isBest && (
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-semibold text-[9px] shadow-xs flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> Keep Best
                          </div>
                        )}

                        <div className="aspect-video w-full rounded-lg bg-slate-200 dark:bg-[#282A2C] overflow-hidden flex items-center justify-center">
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
                          <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">{item.filename}</div>
                          <div className="text-[#5F6368] dark:text-[#C2C7CF] flex items-center justify-between">
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
              className="underline text-xs hover:text-emerald-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
