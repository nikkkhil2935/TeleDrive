import React, { useRef } from 'react';
import {
  Image as ImageIcon,
  Search,
  Users,
  FolderHeart,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    uploadFiles,
    setSelectedAlbum,
    setIsCommandPaletteOpen
  } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navTabs = [
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'search', label: 'Search', icon: Search, action: () => setIsCommandPaletteOpen(true) },
    { id: 'sharing', label: 'Sharing', icon: Users },
    { id: 'albums', label: 'Library', icon: FolderHeart },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) for Mobile Upload above Bottom Nav (Google Photos Mobile Style) */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        title="Upload photos or videos"
        aria-label="Upload photos or videos"
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-2xl bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#041E49] shadow-xl flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* 4-Tab Bottom Navigation Bar (<840px Compact Layout) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#131314]/95 backdrop-blur-lg border-t border-slate-200 dark:border-[#444746]/50 flex items-center justify-around px-2 py-1.5 transition-colors shadow-lg">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else {
                  setSelectedAlbum(null);
                  setActiveTab(tab.id);
                }
              }}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-[11px] font-medium transition-all group"
            >
              <div
                className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-[#D3E3FD] dark:bg-[#004A77] text-[#041E49] dark:text-[#C2E7FF]'
                    : 'text-[#5F6368] dark:text-[#C2C7CF] group-hover:bg-[#F1F3F4] dark:group-hover:bg-[#282A2C]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`mt-0.5 tracking-tight ${
                  isActive
                    ? 'text-[#041E49] dark:text-[#C2E7FF] font-semibold'
                    : 'text-[#5F6368] dark:text-[#C2C7CF]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
