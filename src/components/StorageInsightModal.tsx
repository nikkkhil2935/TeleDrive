import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Image as ImageIcon, Video, ShieldCheck, HardDrive, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { FramelyLogo } from './FramelyLogo';

export const StorageInsightModal: React.FC = () => {
  const { isStorageModalOpen, setIsStorageModalOpen, session } = useApp();

  const stats = useLiveQuery(
    async () => {
      try {
        if (!session) return null;
        const activeScope = session.channelId || session.userId || 'me';
        const all = await db.media.where('libraryId').equals(activeScope).toArray();
        let totalBytes = 0;
        let photoCount = 0;
        let videoCount = 0;
        let photoBytes = 0;
        let videoBytes = 0;

        for (const item of all) {
          totalBytes += item.sizeBytes;
          if (item.kind === 'video') {
            videoCount++;
            videoBytes += item.sizeBytes;
          } else {
            photoCount++;
            photoBytes += item.sizeBytes;
          }
        }

        return {
          totalItems: all.length,
          totalBytes,
          photoCount,
          photoBytes,
          videoCount,
          videoBytes,
        };
      } catch (e) {
        return { totalItems: 0, totalBytes: 0, photoCount: 0, photoBytes: 0, videoCount: 0, videoBytes: 0 };
      }
    },
    [],
    { totalItems: 0, totalBytes: 0, photoCount: 0, photoBytes: 0, videoCount: 0, videoBytes: 0 }
  );

  if (!isStorageModalOpen) return null;

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const photoPercent = stats?.totalBytes ? Math.round((stats.photoBytes / stats.totalBytes) * 100) : 0;
  const videoPercent = stats?.totalBytes ? Math.round((stats.videoBytes / stats.totalBytes) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#FFFFFF] dark:bg-[#131418] border border-slate-200 dark:border-white/[0.08] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-all">
        {/* Header with Pure Framely Logo - STRICTLY NO ENCLOSING BOX */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Pure Framely Logo - No Box */}
            <div className="shrink-0 hover:rotate-12 transition-transform duration-300">
              <FramelyLogo className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-white tracking-tight">Storage Insights</h3>
              <p className="text-xs text-[#5F6368] dark:text-white/50">Telegram Cloud storage allocation</p>
            </div>
          </div>
          <button
            onClick={() => setIsStorageModalOpen(false)}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
          {/* Total Storage Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] flex items-center justify-between">
            <div>
              <div className="text-[#5F6368] dark:text-white/50 font-medium text-xs">Total Library Size</div>
              <div className="text-2xl font-bold text-[#1F1F1F] dark:text-white mt-0.5 tracking-tight font-mono">
                {stats ? formatSize(stats.totalBytes) : '0 MB'}
              </div>
              <div className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted Telegram Channel #{session?.channelId || '4298525450'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#5F6368] dark:text-white/50 font-medium text-xs">Total Media</div>
              <div className="text-2xl font-bold text-[#1F1F1F] dark:text-white mt-0.5 tracking-tight font-mono">
                {stats?.totalItems || 0}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Zero-Knowledge
              </div>
            </div>
          </div>

          {/* Storage Bar Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-[#5F6368] dark:text-white/50">
              <span className="font-medium">Storage composition</span>
              <span className="font-mono text-[#0B57D0] dark:text-sky-400">Unlimited Telegram Cloud</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/[0.08] flex overflow-hidden p-0.5 gap-0.5">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, photoPercent)}%` }}
                title={`Photos: ${photoPercent}%`}
              />
              <div
                className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(2, videoPercent)}%` }}
                title={`Videos: ${videoPercent}%`}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-white/40 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>Photos ({photoPercent}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Videos ({videoPercent}%)</span>
              </div>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] hover:border-sky-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <ImageIcon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1F1F1F] dark:text-white text-sm">Photos</div>
                  <div className="text-[11px] text-[#5F6368] dark:text-white/50">{stats?.photoCount || 0} images</div>
                </div>
              </div>
              <div className="font-semibold text-sm text-[#1F1F1F] dark:text-white font-mono">
                {stats ? formatSize(stats.photoBytes) : '0 MB'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] hover:border-indigo-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Video className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="font-semibold text-[#1F1F1F] dark:text-white text-sm">Videos</div>
                  <div className="text-[11px] text-[#5F6368] dark:text-white/50">{stats?.videoCount || 0} clips</div>
                </div>
              </div>
              <div className="font-semibold text-sm text-[#1F1F1F] dark:text-white font-mono">
                {stats ? formatSize(stats.videoBytes) : '0 MB'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-500/20 text-[11px] text-sky-900 dark:text-sky-200/90 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <span>
              All media files are stored as uncompressed original documents directly in your private Telegram cloud channel. Thumbnails and local index metadata occupy less than 2% of local storage.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
