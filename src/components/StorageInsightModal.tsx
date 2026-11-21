import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, HardDrive, Image as ImageIcon, Video, Calendar, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db';

export const StorageInsightModal: React.FC = () => {
  const { isStorageModalOpen, setIsStorageModalOpen, session } = useApp();

  const stats = useLiveQuery(
    async () => {
      try {
        const all = await db.media.toArray();
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
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Storage Insights</h3>
              <p className="text-xs text-slate-400">Telegram Cloud breakdown</p>
            </div>
          </div>
          <button
            onClick={() => setIsStorageModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-slate-300">
          {/* Total Storage Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-slate-400 font-medium">Total Stored Data</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {stats ? formatSize(stats.totalBytes) : '0 MB'}
              </div>
              <div className="text-[11px] text-sky-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Private Channel #{session?.channelId || '4082'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 font-medium">Total Media</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {stats?.totalItems || 0}
              </div>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Photos</div>
                  <div className="text-[11px] text-slate-400">{stats?.photoCount || 0} images</div>
                </div>
              </div>
              <div className="font-medium text-slate-200">
                {stats ? formatSize(stats.photoBytes) : '0 MB'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Videos</div>
                  <div className="text-[11px] text-slate-400">{stats?.videoCount || 0} clips</div>
                </div>
              </div>
              <div className="font-medium text-slate-200">
                {stats ? formatSize(stats.videoBytes) : '0 MB'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/20 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            All files are stored as uncompressed original documents on Telegram. Thumbnails and local index metadata occupy less than 2% of total storage on your local device.
          </div>
        </div>
      </div>
    </div>
  );
};
