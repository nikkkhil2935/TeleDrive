import React, { useRef } from 'react';
import {
  Search,
  UploadCloud,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  LogOut,
  Image as ImageIcon,
  Sun,
  Moon,
  Laptop,
  ArrowUpDown,
  SlidersHorizontal,
  FolderHeart,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
  Activity,
  Settings
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    session,
    setSession,
    theme,
    setTheme,
    gridDensity,
    setGridDensity,
    setIsAuthModalOpen,
    setIsRebuildModalOpen,
    setIsStorageModalOpen,
    setIsTransfersOpen,
    setIsSettingsOpen,
    activeJobs,
    uploadFiles,
    searchQuery,
    setSearchQuery
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const cycleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-sky-400" />;
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    return <Laptop className="w-4 h-4 text-slate-400" />;
  };

  const activeTransferCount = activeJobs.filter(j => j.status === 'uploading' || j.status === 'processing' || j.status === 'queued').length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Brand & Library Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400 font-semibold text-lg tracking-tight select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="font-bold tracking-tight">Telegram Photos</span>
        </div>

        {session?.channelId && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            <span>Target: Channel #{session.channelId}</span>
          </div>
        )}
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xl mx-6">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dates, albums, or filenames (e.g. Goa, HDR, 2026)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-full pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Grid Density Switcher (Google Photos Pinch/Zoom Equivalent) */}
        <div className="hidden sm:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400">
          <button
            onClick={() => setGridDensity('small')}
            title="Dense Grid"
            className={`p-1.5 rounded-md transition-all ${gridDensity === 'small' ? 'bg-white dark:bg-slate-700 text-sky-500 dark:text-sky-400 shadow-sm' : 'hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGridDensity('medium')}
            title="Medium Grid"
            className={`p-1.5 rounded-md transition-all ${gridDensity === 'medium' ? 'bg-white dark:bg-slate-700 text-sky-500 dark:text-sky-400 shadow-sm' : 'hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGridDensity('large')}
            title="Large Grid"
            className={`p-1.5 rounded-md transition-all ${gridDensity === 'large' ? 'bg-white dark:bg-slate-700 text-sky-500 dark:text-sky-400 shadow-sm' : 'hover:text-slate-900 dark:hover:text-white'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

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
          className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm shadow-sky-500/20 transition-all"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden md:inline">Upload</span>
        </button>

        {/* Transfer Manager Button */}
        <button
          onClick={() => setIsTransfersOpen(true)}
          title="Transfers & Queue Engine"
          className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Activity className="w-4 h-4" />
          {activeTransferCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {activeTransferCount}
            </span>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme} (click to toggle)`}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {getThemeIcon()}
        </button>

        {/* Settings Modal */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {session ? (
          <button
            onClick={() => {
              if (confirm('Log out from Telegram session?')) setSession(null);
            }}
            title="Log Out"
            className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};
