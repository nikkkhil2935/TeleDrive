import React, { useRef, useState, useEffect } from 'react';
import {
  Search,
  Plus,
  HelpCircle,
  Settings,
  Grid,
  Moon,
  Sun,
  Laptop,
  Command,
  Activity,
  Lock,
  LogOut,
  UploadCloud,
  FolderPlus,
  RefreshCw,
  Sparkles,
  AlertCircle,
  X,
  PlaySquare,
  Star,
  Crop,
  FileText
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
    setIsAuthModalOpen,
    setIsOnboardingOpen,
    setIsCommandPaletteOpen,
    setIsSettingsOpen,
    setIsShortcutsOpen,
    setIsTransfersOpen,
    setIsNewAlbumOpen,
    activeJobs,
    uploadFiles,
    searchQuery,
    setSearchQuery,
    isSyncing,
    syncLibrary,
    setActiveTab,
    setMediaFilter,
  } = useApp();

  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (theme === 'dark') return <Moon className="w-5 h-5 text-sky-400" />;
    if (theme === 'light') return <Sun className="w-5 h-5 text-amber-500" />;
    return <Laptop className="w-5 h-5 text-slate-400" />;
  };

  const activeTransferCount = activeJobs.filter(
    j => j.status === 'uploading' || j.status === 'processing' || j.status === 'queued'
  ).length;

  const userInitial = session?.userName?.slice(0, 1).toUpperCase() || (session?.phone ? session.phone.slice(-2) : 'F');

  const suggestions = [
    { label: 'Videos', icon: PlaySquare, action: () => { setMediaFilter('video'); setActiveTab('photos'); } },
    { label: 'Favorites', icon: Star, action: () => setActiveTab('favorites') },
    { label: 'Screenshots', icon: Crop, action: () => setActiveTab('screenshots') },
    { label: 'Documents', icon: FileText, action: () => setActiveTab('documents') },
  ];

  return (
    <header className="h-16 border-b border-slate-200 dark:border-[#444746]/50 bg-white dark:bg-[#131314] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors select-none">
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: Framely Brand & Wordmark (Authentic Google Sans typography) */}
      <div className="flex items-center gap-3 shrink-0">
        <div
          onClick={() => setIsOnboardingOpen(true)}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Framely - Private Photos in your Telegram"
        >
          {/* Framely Bespoke Frame + Spark Mark */}
          <div className="w-8 h-8 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 48 48" className="w-8 h-8 drop-shadow-xs">
              <defs>
                <linearGradient id="headerFramelyGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0B57D0" />
                  <stop offset="1" stopColor="#4285F4" />
                </linearGradient>
                <linearGradient id="headerSparkGrad" x1="30" y1="8" x2="40" y2="18" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FDD663" />
                  <stop offset="1" stopColor="#F9AB00" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#headerFramelyGrad)" />
              <rect x="11" y="11" width="26" height="26" rx="6" stroke="#FFFFFF" strokeWidth="2.5" strokeOpacity="0.95" fill="none" />
              <path d="M12 32L19 23C19.5 22.3 20.5 22.3 21 23L25 28L28.5 24C29 23.4 30 23.4 30.5 24L36 32" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="31" cy="17" r="3.5" fill="url(#headerSparkGrad)" />
            </svg>
          </div>
          <div>
            <span className="text-[18px] font-medium tracking-tight text-[#1F1F1F] dark:text-[#E3E3E3]">
              Framely
            </span>
          </div>
        </div>
      </div>

      {/* Center: Google Photos Desktop Search Input with Suggestions */}
      <div ref={searchContainerRef} className="flex-1 max-w-2xl mx-3 sm:mx-8 relative">
        <div className="relative group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#5F6368] dark:text-[#C2C7CF] group-focus-within:text-[#0B57D0] dark:group-focus-within:text-[#A8C7FA] transition-colors" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search your photos, dates, or places"
            value={searchQuery}
            onFocus={() => setShowSearchSuggestions(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F0F4F9] dark:bg-[#1E1F20] hover:bg-[#E9EEF6] dark:hover:bg-[#282A2C] focus:bg-white dark:focus:bg-[#1E1F20] border border-transparent focus:border-slate-300 dark:focus:border-[#444746] rounded-full pl-12 pr-18 py-2.5 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#5F6368] dark:placeholder:text-[#C2C7CF] focus:outline-none shadow-xs transition-all"
          />

          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-[#282A2C] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              title="Command Palette (Ctrl+K or ⌘K)"
              className="hidden sm:flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-[#2E3133] hover:bg-slate-300 text-slate-600 dark:text-[#C2C7CF] text-[11px] font-mono transition-colors"
            >
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </button>
          </div>
        </div>

        {/* Search Suggestions Dropdown */}
        {showSearchSuggestions && !searchQuery && (
          <div className="t-dropdown absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E1F20] rounded-2xl shadow-xl border border-slate-200 dark:border-[#444746] py-3 px-2 z-50">
            <div className="px-3 pb-2 text-[11px] font-semibold text-[#5F6368] dark:text-[#C2C7CF] uppercase tracking-wider">
              Explore Categories
            </div>
            <div className="grid grid-cols-2 gap-1">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => {
                      s.action();
                      setShowSearchSuggestions(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA] shrink-0" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Actions: Create (+), Help (?), Settings, Theme, Avatar */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* + Create / Upload Button */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            title="Create & Upload (+)"
            className="p-2 sm:p-2.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          {showCreateMenu && (
            <div className="t-dropdown absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#1E1F20] rounded-2xl shadow-xl border border-slate-200 dark:border-[#444746] py-2 z-50">
              <button
                onClick={() => {
                  setShowCreateMenu(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-[#0B57D0] dark:text-[#A8C7FA]" />
                <span>Upload Photos & Videos</span>
              </button>
              <button
                onClick={() => {
                  setShowCreateMenu(false);
                  setIsNewAlbumOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-indigo-500" />
                <span>New Album</span>
              </button>
            </div>
          )}
        </div>

        {/* Sync from Telegram Button */}
        <button
          onClick={syncLibrary}
          disabled={isSyncing}
          title={isSyncing ? 'Syncing with Telegram channel...' : 'Sync newly uploaded photos from Telegram'}
          className="p-2 sm:p-2.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-[#0B57D0]' : ''}`} />
        </button>

        {/* Transfer Engine Queue Button */}
        <button
          onClick={() => setIsTransfersOpen(true)}
          title="Transfer Engine & Queue"
          className="relative p-2 sm:p-2.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors"
        >
          <Activity className="w-5 h-5" />
          {activeTransferCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#0B57D0] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
              {activeTransferCount}
            </span>
          )}
        </button>

        {/* Help (?) Icon (Screenshot 3 & Spec Phase 4) */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          title="Help & Shortcuts (?)"
          className="p-2 sm:p-2.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings Gear */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
          className="p-2 sm:p-2.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme}`}
          className="p-2 sm:p-2.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors"
        >
          {getThemeIcon()}
        </button>

        {/* Circular User Avatar */}
        {session ? (
          <div className="relative pl-1">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={`Logged in as ${session.userName || session.phone || 'User'}`}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0B57D0] to-indigo-600 text-white font-medium text-xs flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-[#0B57D0]/40 transition-all"
            >
              {userInitial}
            </button>

            {showUserMenu && (
              <div className="t-dropdown absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1E1F20] rounded-2xl shadow-xl border border-slate-200 dark:border-[#444746] p-3 z-50 space-y-2">
                <div className="px-2 py-1">
                  <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                    {session.userName || 'Telegram User'}
                  </div>
                  <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF] truncate">
                    {session.phone || `Channel #${session.channelId}`}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-[#444746]/50 pt-1 space-y-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      lockVault();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors"
                  >
                    <Lock className="w-4 h-4 text-slate-500" />
                    <span>Lock Security Vault</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      if (confirm('Log out from Telegram and clear local photo cache?')) {
                        logout();
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out & Purge</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="gp-btn-primary text-xs"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Single-Tab Conflict Banner */}
      {isAnotherTabActive && (
        <div className="absolute top-16 inset-x-0 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg z-30">
          <AlertCircle className="w-4 h-4" />
          <span>Another browser tab is actively connected. Running in safe read-only mode.</span>
        </div>
      )}
    </header>
  );
};
