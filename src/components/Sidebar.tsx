import React, { useState, useRef } from 'react';
import {
  Image,
  Compass,
  Users,
  Folder,
  FileText,
  Crop,
  Star,
  MapPin,
  PlaySquare,
  Clock,
  Archive,
  Lock,
  Cloud,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Copy,
  ShieldCheck
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsStorageModalOpen,
    setIsDuplicatesOpen,
    setIsPrivacyOpen,
    setSelectedAlbum,
    lockVault,
    uploadFiles,
    session,
  } = useApp();

  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
  const [showDocumentsCallout, setShowDocumentsCallout] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live library size from Dexie, strictly isolated to active session
  const totalSizeBytes = useLiveQuery(async () => {
    if (!session) return 0;
    const activeScope = session.channelId || session.userId || 'me';
    const items = await db.media.where('libraryId').equals(activeScope).toArray();
    return items.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
  }, [session?.channelId, session?.userId], 0);

  const formattedStorage = totalSizeBytes > 1_000_000_000
    ? `${(totalSizeBytes / 1_000_000_000).toFixed(1)} GB of 5 TB used`
    : totalSizeBytes > 0
    ? `${(totalSizeBytes / 1_000_000).toFixed(1)} MB of 5 TB used`
    : '31.9 GB of 5 TB used';

  const progressPercent = Math.max(2, Math.min(100, (totalSizeBytes / (5 * 1024 * 1024 * 1024 * 1024)) * 100));

  const collectionItems = [
    { id: 'albums', label: 'Albums', icon: Folder },
    { id: 'documents', label: 'Documents', icon: FileText, hasCallout: true },
    { id: 'screenshots', label: 'Screenshots & recordings', icon: Crop },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'people', label: 'People & pets', icon: Users },
    { id: 'places', label: 'Places', icon: MapPin },
    { id: 'videos', label: 'Videos', icon: PlaySquare },
    { id: 'recent', label: 'Recently added', icon: Clock },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'locked', label: 'Locked Folder', icon: Lock },
  ];

  const handleSelectTab = (tabId: string) => {
    setSelectedAlbum(null);
    if (tabId === 'locked') {
      lockVault();
    }
    setActiveTab(tabId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <aside className="hidden md:flex w-20 lg:w-64 border-r border-slate-200 dark:border-[#444746]/50 bg-white dark:bg-[#131314] p-3 lg:px-4 lg:py-4 flex-col justify-between select-none transition-all duration-200 shrink-0 overflow-y-auto">
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-4">
        {/* Prominent Google Photos Styled Upload Button */}
        <div className="hidden lg:block px-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#041E49] font-medium text-sm shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload photos</span>
          </button>
        </div>

        {/* Primary Navigation Pills */}
        <nav className="space-y-1">
          <button
            onClick={() => handleSelectTab('photos')}
            title="Photos"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'photos'
                ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#C2E7FF]'
                : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C]'
            }`}
          >
            <Image className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline truncate">Photos</span>
          </button>

          <button
            onClick={() => handleSelectTab('explore')}
            title="Explore"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'explore'
                ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#C2E7FF]'
                : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C]'
            }`}
          >
            <Compass className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline truncate">Explore</span>
          </button>

          <button
            onClick={() => handleSelectTab('sharing')}
            title="Sharing"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'sharing'
                ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#C2E7FF]'
                : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C]'
            }`}
          >
            <Users className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline truncate">Sharing</span>
          </button>
        </nav>

        {/* Collapsible Collections Section (Spec Phase 4) */}
        <div className="pt-2">
          <button
            onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-semibold text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-white transition-colors"
          >
            <span className="hidden lg:inline tracking-wide">Collections</span>
            {isCollectionsOpen ? (
              <ChevronDown className="w-4 h-4 hidden lg:inline" />
            ) : (
              <ChevronRight className="w-4 h-4 hidden lg:inline" />
            )}
          </button>

          {isCollectionsOpen && (
            <div className="space-y-0.5 mt-1 relative">
              {collectionItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isDocuments = item.id === 'documents';

                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => handleSelectTab(item.id)}
                      title={item.label}
                      className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#D3E3FD] text-[#041E49] dark:bg-[#004A77] dark:text-[#C2E7FF]'
                          : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C]'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="hidden lg:inline truncate text-[13.5px]">{item.label}</span>
                    </button>

                    {/* Google Photos Screenshot 3 Callout: Documents Popover Tooltip */}
                    {isDocuments && showDocumentsCallout && (
                      <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 z-40 items-start gap-2 bg-[#A8C7FA] text-[#041E49] p-3 rounded-2xl shadow-xl border border-sky-400/40 w-56 animate-in fade-in slide-in-from-left-2 duration-200">
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[7px] border-y-transparent border-r-[8px] border-r-[#A8C7FA]" />
                        <div className="text-xs font-medium leading-snug">
                          Documents are now organized automatically by category
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDocumentsCallout(false);
                          }}
                          className="p-0.5 rounded-full hover:bg-black/10 text-[#041E49] shrink-0"
                          title="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Utilities: Duplicates & Privacy */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#444746]/40">
          <nav className="space-y-0.5">
            <button
              onClick={() => setIsDuplicatesOpen(true)}
              title="Duplicate Finder"
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-full text-[13.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-all"
            >
              <Copy className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline truncate">Duplicates</span>
            </button>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              title="Privacy & Storage Security"
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-full text-[13.5px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="hidden lg:inline truncate">Privacy & Trust</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Storage Widget & Google Photos Footer (Spec Phase 4 & 7) */}
      <div className="pt-4 border-t border-slate-200 dark:border-[#444746]/50 space-y-3">
        <div className="px-2 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[#5F6368] dark:text-[#C2C7CF]">
            <Cloud className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA] shrink-0" />
            <span className="hidden lg:inline">Storage</span>
          </div>
          
          <div className="text-[12px] text-[#5F6368] dark:text-[#C2C7CF] hidden lg:block">
            {formattedStorage}
          </div>

          <div className="w-full bg-slate-200 dark:bg-[#333538] rounded-full h-1 overflow-hidden">
            <div
              className="bg-[#0B57D0] dark:bg-[#A8C7FA] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="hidden lg:block w-full py-1.5 px-4 rounded-full border border-slate-300 dark:border-[#5E5E5E] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] text-xs font-medium transition-colors text-center"
          >
            Get more storage
          </button>
        </div>

        {/* Legal Footer Links (Spec Phase 4) */}
        <div className="hidden lg:flex items-center justify-start gap-1 text-[11px] text-[#5F6368] dark:text-[#C2C7CF] px-2 pt-1 select-none">
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:underline">Privacy</button>
          <span>•</span>
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:underline">Terms</button>
          <span>•</span>
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:underline">Policy</button>
        </div>
      </div>
    </aside>
  );
};
