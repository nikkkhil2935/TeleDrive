import React, { useState } from 'react';
import {
  Image,
  Bell,
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  Crop,
  Star,
  Users,
  MapPin,
  PlaySquare,
  Clock,
  Archive,
  Lock,
  Cloud,
  X,
  ShieldCheck,
  Copy
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
    setIsOnboardingOpen,
    setSelectedAlbum,
    lockVault,
  } = useApp();

  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
  const [showDocumentsCallout, setShowDocumentsCallout] = useState(true);

  // Compute live library size from Dexie
  const totalSizeBytes = useLiveQuery(async () => {
    const items = await db.media.toArray();
    return items.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);
  }, [], 0);

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

  return (
    <aside className="hidden md:flex w-20 lg:w-64 border-r border-slate-200 dark:border-[#282a2c] bg-white dark:bg-[#131314] p-3 lg:px-4 lg:py-5 flex-col justify-between select-none transition-all duration-200 shrink-0 overflow-y-auto">
      <div className="space-y-4">
        {/* Google Photos Brand Header (Screenshot 3) */}
        <div
          onClick={() => setIsOnboardingOpen(true)}
          className="flex items-center gap-3 px-2 py-1 cursor-pointer group"
          title="Google Photos - Click for Guided Setup"
        >
          {/* Authentic Google Photos Pinwheel SVG */}
          <div className="w-8 h-8 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 drop-shadow-sm group-hover:scale-105 transition-transform">
              <path fill="#EA4335" d="M12 0c2.2 0 4 1.8 4 4v4h-4c-2.2 0-4-1.8-4-4s1.8-4 4-4z" />
              <path fill="#FBBC04" d="M24 12c0 2.2-1.8 4-4 4h-4v-4c0-2.2 1.8-4 4-4s4 1.8 4 4z" />
              <path fill="#34A853" d="M12 24c-2.2 0-4-1.8-4-4v-4h4c2.2 0 4 1.8 4 4s-1.8 4-4 4z" />
              <path fill="#4285F4" d="M0 12c0-2.2 1.8-4 4-4h4v4c0 2.2-1.8 4-4 4s-4-1.8-4-4z" />
            </svg>
          </div>
          <div className="hidden lg:block">
            <span className="text-[17px] font-medium tracking-tight text-slate-800 dark:text-[#e3e3e3]">
              Google Photos
            </span>
          </div>
        </div>

        {/* Primary Navigation Pills (Photos, Updates) */}
        <nav className="space-y-1">
          <button
            onClick={() => handleSelectTab('photos')}
            title="Photos"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'photos'
                ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                : 'text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#1f1f1f]'
            }`}
          >
            <Image className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline truncate">Photos</span>
          </button>

          <button
            onClick={() => handleSelectTab('updates')}
            title="Updates"
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeTab === 'updates'
                ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                : 'text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#1f1f1f]'
            }`}
          >
            <Bell className="w-5 h-5 shrink-0" />
            <span className="hidden lg:inline truncate">Updates</span>
          </button>
        </nav>

        {/* Collections Dropdown */}
        <div className="pt-2">
          <button
            onClick={() => setIsCollectionsOpen(!isCollectionsOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-500 dark:text-[#8e918f] hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <span className="hidden lg:inline">Collections</span>
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
                          ? 'bg-[#c2e7ff] text-[#001d35] dark:bg-[#004a77] dark:text-[#c2e7ff]'
                          : 'text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#1f1f1f]'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="hidden lg:inline truncate text-[13.5px]">{item.label}</span>
                    </button>

                    {/* Google Photos Screenshot 3 Callout: Documents Popover */}
                    {isDocuments && showDocumentsCallout && (
                      <div className="hidden lg:flex absolute left-full top-1/2 -translate-y-1/2 ml-3 z-40 items-start gap-2 bg-[#a8c7fa] text-[#041e49] p-3 rounded-2xl shadow-xl border border-sky-400/30 w-56 animate-in fade-in slide-in-from-left-2 duration-200">
                        {/* Callout Triangle pointer */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[7px] border-y-transparent border-r-[8px] border-r-[#a8c7fa]" />
                        <div className="text-xs font-medium leading-snug">
                          Documents are now organized automatically by category
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDocumentsCallout(false);
                          }}
                          className="p-0.5 rounded-full hover:bg-black/10 text-[#041e49] shrink-0"
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
        <div className="pt-2 border-t border-slate-100 dark:border-[#282a2c]/60">
          <nav className="space-y-0.5">
            <button
              onClick={() => setIsDuplicatesOpen(true)}
              title="Duplicate Finder"
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-full text-[13.5px] font-medium text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-all"
            >
              <Copy className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline truncate">Duplicates</span>
            </button>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              title="Privacy & Storage Security"
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-full text-[13.5px] font-medium text-slate-700 dark:text-[#c4c7c5] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="hidden lg:inline truncate">Privacy & Trust</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Storage Widget & Google Photos Footer (Screenshot 3) */}
      <div className="pt-4 border-t border-slate-200 dark:border-[#282a2c] space-y-3">
        {/* Storage Widget */}
        <div className="px-2 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-[#c4c7c5]">
            <Cloud className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="hidden lg:inline">Storage</span>
          </div>
          
          <div className="text-[12px] text-slate-600 dark:text-[#8e918f] hidden lg:block">
            {formattedStorage}
          </div>

          <div className="w-full bg-slate-200 dark:bg-[#333538] rounded-full h-1 overflow-hidden">
            <div
              className="bg-[#1a73e8] dark:bg-[#8ab4f8] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="hidden lg:block w-full py-1.5 px-4 rounded-full border border-slate-300 dark:border-[#5e5e5e] hover:bg-slate-100 dark:hover:bg-[#1f1f1f] text-[#0b57d0] dark:text-[#a8c7fa] text-xs font-medium transition-colors text-center"
          >
            Get more storage
          </button>
        </div>

        {/* Legal Footer (Screenshot 3) */}
        <div className="hidden lg:flex items-center justify-start gap-1 text-[11px] text-slate-400 dark:text-[#8e918f] px-2 pt-1 select-none">
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
