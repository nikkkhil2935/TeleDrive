import React, { useRef } from 'react';
import {
  Search,
  UploadCloud,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Grid3X3,
  Grid2X2,
  LayoutGrid,
  Activity,
  Settings,
  Lock,
  AlertCircle,
  Command,
  Copy,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const {
    session,
    logout,
    lockVault,
    isAnotherTabActive,
    theme,
    setTheme,
    gridDensity,
    setGridDensity,
    setIsAuthModalOpen,
    setIsOnboardingOpen,
    setIsDuplicatesOpen,
    setIsCommandPaletteOpen,
    setIsPrivacyOpen,
    setIsStorageModalOpen,
    setIsTransfersOpen,
    setIsSettingsOpen,
    setIsShortcutsOpen,
    activeJobs,
    uploadFiles,
    searchQuery,
    setSearchQuery,
    isSyncing,
    syncLibrary,
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
    else if (theme === 'light') setTheme('midnight');
    else if (theme === 'midnight') setTheme('system');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-sky-400" />;
    if (theme === 'midnight') return <Moon className="w-4 h-4 text-purple-400" />;
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    return <Laptop className="w-4 h-4 text-slate-400" />;
  };

  const activeTransferCount = activeJobs.filter(
    j => j.status === 'uploading' || j.status === 'processing' || j.status === 'queued'
  ).length;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Brand & Library Badge */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div
          onClick={() => setIsOnboardingOpen(true)}
          className="flex items-center gap-2 sm:gap-2.5 text-sky-600 dark:text-sky-400 font-semibold text-base sm:text-lg tracking-tight select-none cursor-pointer group"
          title="Framely - Click for Setup & Guided Tour"
        >
          {/* Framely Geometric Frame + Spark SVG Mark */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 48 48" className="w-5 h-5 sm:w-6 sm:h-6" fill="none">
              <rect x="7" y="7" width="34" height="34" rx="8" stroke="#FFFFFF" strokeWidth="3" strokeOpacity="0.95" />
              <path d="M9 35L19 23C19.6 22.3 20.6 22.3 21.2 23L26 29L30.5 24C31.1 23.4 32.1 23.4 32.7 24L39 33" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="33" cy="15" r="4" fill="#FDD663" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline">Framely</span>
              <span className="font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:hidden text-sm">Framely</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 hidden md:inline">PRIVATE</span>
            </div>
            <div className="text-[10px] text-slate-400 -mt-1 hidden lg:block">Telegram Cloud Photos</div>
          </div>
        </div>

        {session?.channelId && (
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
            <span>Target: Channel #{session.channelId}</span>
          </div>
        )}
      </div>

      {/* Global Search Bar with Cmd+K hint */}
      <div className="flex-1 max-w-xs sm:max-w-xl mx-2 sm:mx-6">
        <div className="relative group">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-sky-500 transition-colors" />
          <input
            type="text"
            placeholder="Search dates, albums, or filenames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-full pl-8 sm:pl-10 pr-16 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Open Command Palette (Ctrl+K or ⌘K)"
            className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 text-[10px] font-mono transition-colors"
          >
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Grid Density Switcher */}
        <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400">
          <button
            onClick={() => setGridDensity('small')}
            title="Dense Grid"
            className={`p-1.5 rounded-md transition-all ${
              gridDensity === 'small'
                ? 'bg-white dark:bg-slate-700 text-sky-500 dark:text-sky-400 shadow-sm'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGridDensity('medium')}
            title="Medium Grid"
            className={`p-1.5 rounded-md transition-all ${
              gridDensity === 'medium'
                ? 'bg-white dark:bg-slate-700 text-sky-500 dark:text-sky-400 shadow-sm'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Grid2X2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setGridDensity('large')}
            title="Large Grid"
            className={`p-1.5 rounded-md transition-all ${
              gridDensity === 'large'
                ? 'bg-white dark:bg-slate-700 text-sky-500 dark:text-sky-400 shadow-sm'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
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
          className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg shadow-sm shadow-sky-500/20 transition-all shrink-0"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* Sync from Telegram Button */}
        <button
          onClick={syncLibrary}
          disabled={isSyncing}
          title={isSyncing ? 'Syncing with Telegram channel...' : 'Sync newly uploaded photos from Telegram'}
          className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-500' : ''}`} />
        </button>

        {/* Transfer Manager Button */}
        <button
          onClick={() => setIsTransfersOpen(true)}
          title="Transfers & Queue Engine"
          className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Activity className="w-4 h-4" />
          {activeTransferCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {activeTransferCount}
            </span>
          )}
        </button>

        {/* Duplicates Modal Trigger */}
        <button
          onClick={() => setIsDuplicatesOpen(true)}
          title="Duplicate Finder & Clean-up"
          className="hidden lg:flex p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Privacy & How Data is Stored Modal Trigger */}
        <button
          onClick={() => setIsPrivacyOpen(true)}
          title="Privacy & How Data is Stored"
          className="hidden sm:flex p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme} (click to toggle)`}
          className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {getThemeIcon()}
        </button>

        {/* Settings Modal */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Settings & Security"
          className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Keyboard Shortcuts (?) Button */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          title="Keyboard Shortcuts (?)"
          className="hidden xl:flex p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {session ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (confirm('Lock security vault? You will need your vault passphrase to unlock.')) {
                  lockVault();
                }
              }}
              title="Lock Vault (Ctrl+L)"
              className="p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (confirm('Log out from Telegram and purge all local photos and session keys?')) {
                  logout();
                }
              }}
              title="Log Out & Purge Local Data"
              className="p-1.5 sm:p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 text-sky-600 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 font-medium px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Single-Tab Conflict Warning Banner */}
      {isAnotherTabActive && (
        <div className="absolute top-16 inset-x-0 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg z-30">
          <AlertCircle className="w-4 h-4" />
          <span>Telegram session is currently open in another tab. Close other tabs to avoid session conflicts.</span>
        </div>
      )}
    </header>
  );
};
