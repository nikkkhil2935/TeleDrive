import React from 'react';
import {
  Compass,
  Users,
  MapPin,
  PlaySquare,
  Crop,
  FileText,
  Star,
  Copy,
  Folder,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';

export const ExploreView: React.FC = () => {
  const {
    session,
    setActiveTab,
    setIsDuplicatesOpen,
    setIsStorageModalOpen,
    setSelectedAlbum
  } = useApp();

  const activeScope = session?.channelId || session?.userId || 'me';

  const allMedia = useLiveQuery(
    async () => {
      if (!session) return [];
      const items = await db.media.where('libraryId').equals(activeScope).toArray();
      return items.filter(m => !m.trashedAt && !m.isArchived);
    },
    [session?.channelId, session?.userId],
    []
  );

  const people = useLiveQuery(
    async () => {
      if (!session) return [];
      const records = await db.people.where('libraryId').equals(activeScope).toArray();
      return records.slice(0, 8);
    },
    [session?.channelId, session?.userId],
    []
  );

  const videoCount = (allMedia || []).filter(m => m.kind === 'video').length;
  const favoritesCount = (allMedia || []).filter(m => m.isFavorite).length;
  const screenshotsCount = (allMedia || []).filter(m => /screenshot|capture/i.test(m.filename)).length;
  const documentsCount = (allMedia || []).filter(m => /doc|pdf|receipt|bill|invoice/i.test(m.filename)).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#F8FAFD] dark:bg-[#131314] select-none">
      {/* Explore Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight flex items-center gap-2">
          <Compass className="w-6 h-6 text-[#0B57D0] dark:text-[#A8C7FA]" />
          <span>Explore</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#C2C7CF] mt-1">
          Smart categories, faces, places, and activities in your photo library.
        </p>
      </div>

      {/* People & Pets Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA]" />
            <span>People & Pets</span>
          </h2>
          <button
            onClick={() => setActiveTab('people')}
            className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] font-medium hover:underline flex items-center gap-0.5"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {people && people.length > 0 ? (
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {people.map((p) => (
              <div
                key={p.id}
                onClick={() => setActiveTab('people')}
                className="flex flex-col items-center group cursor-pointer shrink-0"
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 group-hover:border-[#0B57D0] dark:group-hover:border-[#A8C7FA] group-hover:scale-105 transition-all shadow-xs">
                  <img src={p.faceUrl} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mt-2 max-w-[80px] truncate text-center">
                  {p.name}
                </span>
                <span className="text-[10px] text-[#5F6368] dark:text-[#C2C7CF]">
                  {p.count} items
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div
            onClick={() => setActiveTab('people')}
            className="p-6 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/40 flex items-center justify-between cursor-pointer hover:border-[#0B57D0] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">Set up People & Pets</h3>
                <p className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">Scan library to cluster faces and portraits</p>
              </div>
            </div>
            <span className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] font-medium">Scan now →</span>
          </div>
        )}
      </section>

      {/* Categories Bento Grid (Google Photos Desktop) */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
          Categories
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div
            onClick={() => setActiveTab('videos')}
            className="p-4 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PlaySquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">Videos</div>
              <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">{videoCount} videos</div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('favorites')}
            className="p-4 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">Favorites</div>
              <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">{favoritesCount} items</div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('screenshots')}
            className="p-4 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center shrink-0">
              <Crop className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">Screenshots</div>
              <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">{screenshotsCount} items</div>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('documents')}
            className="p-4 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all hover:scale-[1.02] flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-500 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">Documents</div>
              <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">{documentsCount} items</div>
            </div>
          </div>
        </div>
      </section>

      {/* Utilities Hub */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
          Utilities & Management
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div
            onClick={() => setIsDuplicatesOpen(true)}
            className="p-5 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">Clean Up Duplicates</h3>
                <p className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">Find and merge byte-for-byte SHA duplicate files</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          <div
            onClick={() => setIsStorageModalOpen(true)}
            className="p-5 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#0B57D0]/15 text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">Storage Insights</h3>
                <p className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">Inspect space utilization and Telegram cloud quota</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </section>
    </div>
  );
};
