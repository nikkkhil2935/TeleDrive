import React, { useState, useEffect } from 'react';
import {
  Search,
  Image as ImageIcon,
  Compass,
  Heart,
  FolderHeart,
  Archive,
  Trash2,
  HardDrive,
  Copy,
  Activity,
  RefreshCw,
  Lock,
  ShieldCheck,
  Settings,
  Sun,
  Moon,
  UploadCloud,
  X,
  Sparkles,
  Command
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CommandPaletteModal: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setActiveTab,
    setIsDuplicatesOpen,
    setIsStorageModalOpen,
    setIsTransfersOpen,
    setIsPrivacyOpen,
    setIsSettingsOpen,
    setIsRebuildModalOpen,
    lockVault,
    setTheme,
    syncLibrary,
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isCommandPaletteOpen) setQuery('');
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    {
      id: 'photos',
      title: 'Go to Photos Timeline',
      category: 'Navigation',
      icon: ImageIcon,
      perform: () => setActiveTab('photos'),
    },
    {
      id: 'explore',
      title: 'Explore & Search',
      category: 'Navigation',
      icon: Compass,
      perform: () => setActiveTab('explore'),
    },
    {
      id: 'favorites',
      title: 'View Favorites',
      category: 'Navigation',
      icon: Heart,
      perform: () => setActiveTab('favorites'),
    },
    {
      id: 'albums',
      title: 'View Albums',
      category: 'Navigation',
      icon: FolderHeart,
      perform: () => setActiveTab('albums'),
    },
    {
      id: 'archive',
      title: 'View Archive',
      category: 'Navigation',
      icon: Archive,
      perform: () => setActiveTab('archive'),
    },
    {
      id: 'trash',
      title: 'Recently Deleted / Trash',
      category: 'Navigation',
      icon: Trash2,
      perform: () => setActiveTab('trash'),
    },
    {
      id: 'duplicates',
      title: 'Duplicate Finder & Clean-up',
      category: 'Tools',
      icon: Copy,
      perform: () => setIsDuplicatesOpen(true),
    },
    {
      id: 'storage',
      title: 'Storage Insights & Breakdown',
      category: 'Tools',
      icon: HardDrive,
      perform: () => setIsStorageModalOpen(true),
    },
    {
      id: 'transfers',
      title: 'Transfer Queue & Engine',
      category: 'Tools',
      icon: Activity,
      perform: () => setIsTransfersOpen(true),
    },
    {
      id: 'sync',
      title: 'Sync Recent Telegram Messages',
      category: 'Tools',
      icon: RefreshCw,
      perform: () => syncLibrary(),
    },
    {
      id: 'rebuild',
      title: 'Rebuild Full Metadata Index',
      category: 'Tools',
      icon: Sparkles,
      perform: () => setIsRebuildModalOpen(true),
    },
    {
      id: 'lock',
      title: 'Lock Vault Now (Ctrl+L)',
      category: 'Security',
      icon: Lock,
      perform: () => lockVault(),
    },
    {
      id: 'privacy',
      title: 'Privacy Dashboard & How Data is Stored',
      category: 'Security',
      icon: ShieldCheck,
      perform: () => setIsPrivacyOpen(true),
    },
    {
      id: 'settings',
      title: 'Preferences & Settings',
      category: 'Preferences',
      icon: Settings,
      perform: () => setIsSettingsOpen(true),
    },
    {
      id: 'theme-dark',
      title: 'Switch to Dark Mode (Google Photos)',
      category: 'Appearance',
      icon: Moon,
      perform: () => setTheme('dark'),
    },
    {
      id: 'theme-light',
      title: 'Switch to Light Mode',
      category: 'Appearance',
      icon: Sun,
      perform: () => setTheme('light'),
    },
    {
      id: 'theme-midnight',
      title: 'Switch to Midnight OLED Mode',
      category: 'Appearance',
      icon: Moon,
      perform: () => setTheme('midnight'),
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      onClick={() => setIsCommandPaletteOpen(false)}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-20 p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="t-modal-content bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-200 dark:border-[#444746]/40 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to screen..."
            className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-slate-400 focus:outline-none"
          />
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#282A2C] text-[#5F6368] dark:text-[#C2C7CF]">
            <span>ESC</span>
          </div>
        </div>

        {/* Action Results */}
        <div className="p-2 overflow-y-auto max-h-[55vh] space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5F6368] dark:text-[#C2C7CF]">
              No matching commands found.
            </div>
          ) : (
            filteredActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    action.perform();
                    setIsCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-[#282A2C] transition-colors group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#282A2C] flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-[#0B57D0] dark:group-hover:text-[#A8C7FA] transition-colors shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                      {action.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#5F6368] dark:text-[#C2C7CF] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#282A2C] shrink-0">
                    {action.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-[#444746]/40 text-[10px] text-[#5F6368] dark:text-[#C2C7CF] flex items-center justify-between bg-[#F8FAFD] dark:bg-[#131314]">
          <span>Use <b>↑ ↓</b> to navigate, <b>Enter</b> to select</span>
          <span className="flex items-center gap-1 font-medium">
            <Command className="w-3 h-3" /> Framely Palette
          </span>
        </div>
      </div>
    </div>
  );
};
