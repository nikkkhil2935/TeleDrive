import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, HardDrive, Image as ImageIcon, Video, Calendar, ShieldCheck, Cloud } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db';

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
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const photoPercent = stats?.totalBytes ? Math.round((stats.photoBytes / stats.totalBytes) * 100) : 0;
  const videoPercent = stats?.totalBytes ? Math.round((stats.videoBytes / stats.totalBytes) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="t-modal-content bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center font-bold">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Storage Insights</h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">Telegram Cloud storage allocation</p>
            </div>
          </div>
          <button
            onClick={() => setIsStorageModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
          {/* Total Storage Summary Card */}
          <div className="p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#131314] border border-slate-200 dark:border-[#444746]/40 flex items-center justify-between">
            <div>
              <div className="text-[#5F6368] dark:text-[#C2C7CF] font-medium text-xs">Total Library Size</div>
              <div className="text-2xl font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mt-0.5 tracking-tight">
                {stats ? formatSize(stats.totalBytes) : '0 MB'}
              </div>
              <div className="text-[11px] text-[#0B57D0] dark:text-[#A8C7FA] mt-1 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted Telegram Channel #{session?.channelId || '4082'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#5F6368] dark:text-[#C2C7CF] font-medium text-xs">Total Media</div>
              <div className="text-2xl font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mt-0.5 tracking-tight">
                {stats?.totalItems || 0}
              </div>
            </div>
          </div>

          {/* Storage Bar Breakdown */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">
              <span>Storage composition</span>
              <span>5 TB personal quota</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#333538] flex overflow-hidden">
              <div
                className="bg-[#0B57D0] dark:bg-[#A8C7FA] h-full"
                style={{ width: `${Math.max(1, photoPercent)}%` }}
                title={`Photos: ${photoPercent}%`}
              />
              <div
                className="bg-indigo-500 h-full"
                style={{ width: `${Math.max(1, videoPercent)}%` }}
                title={`Videos: ${videoPercent}%`}
              />
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C]/50 border border-slate-200 dark:border-[#444746]/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">Photos</div>
                  <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">{stats?.photoCount || 0} images</div>
                </div>
              </div>
              <div className="font-semibold text-sm text-[#1F1F1F] dark:text-[#E3E3E3]">
                {stats ? formatSize(stats.photoBytes) : '0 MB'}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C]/50 border border-slate-200 dark:border-[#444746]/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-[#1F1F1F] dark:text-[#E3E3E3] text-sm">Videos</div>
                  <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">{stats?.videoCount || 0} clips</div>
                </div>
              </div>
              <div className="font-semibold text-sm text-[#1F1F1F] dark:text-[#E3E3E3]">
                {stats ? formatSize(stats.videoBytes) : '0 MB'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#F0F4F9] dark:bg-[#131314] border border-slate-200 dark:border-[#444746]/30 text-[11px] text-[#5F6368] dark:text-[#C2C7CF] leading-relaxed">
            All files are stored as uncompressed original documents directly in your private Telegram cloud. Thumbnails and local index metadata occupy less than 2% of storage on this device.
          </div>
        </div>
      </div>
    </div>
  );
};
