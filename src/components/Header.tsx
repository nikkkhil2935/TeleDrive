import React, { useRef, useState } from 'react';
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
  AlertCircle
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
  } = useApp();

  const [showCreateMenu, setShowCreateMenu] = useState(false);
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

  const userInitial = session?.userName?.slice(0, 1).toUpperCase() || (session?.phone ? session.phone.slice(-2) : 'U');

  return (
    <header className="h-16 border-b border-slate-200 dark:border-[#282a2c] bg-white dark:bg-[#131314] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors select-none">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left (Mobile brand view only since Desktop has it in sidebar) */}
      <div className="flex items-center gap-2 md:hidden shrink-0">
        <div
          onClick={() => setIsOnboardingOpen(true)}
          className="w-8 h-8 flex items-center justify-center cursor-pointer"
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7">
            <path fill="#EA4335" d="M12 0c2.2 0 4 1.8 4 4v4h-4c-2.2 0-4-1.8-4-4s1.8-4 4-4z" />
            <path fill="#FBBC04" d="M24 12c0 2.2-1.8 4-4 4h-4v-4c0-2.2 1.8-4 4-4s4 1.8 4 4z" />
            <path fill="#34A853" d="M12 24c-2.2 0-4-1.8-4-4v-4h4c2.2 0 4 1.8 4 4s-1.8 4-4 4z" />
            <path fill="#4285F4" d="M0 12c0-2.2 1.8-4 4-4h4v4c0 2.2-1.8 4-4 4s-4-1.8-4-4z" />
          </svg>
        </div>
      </div>

      {/* Center: Google Photos Desktop Pill Search Bar (Screenshot 3) */}
      <div className="flex-1 max-w-2xl mx-2 sm:mx-6">
        <div className="relative group">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8e918f] group-focus-within:text-[#1a73e8] dark:group-focus-within:text-[#8ab4f8] transition-colors" />
          <input
            type="text"
            placeholder='Search "Sandor", places, or dates'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f0f4f9] dark:bg-[#1e1f20] hover:bg-[#e9eef6] dark:hover:bg-[#282a2c] focus:bg-white dark:focus:bg-[#1e1f20] border border-transparent focus:border-slate-300 dark:focus:border-[#444746] rounded-full pl-12 pr-16 py-2.5 text-sm text-slate-800 dark:text-[#e3e3e3] placeholder:text-slate-500 dark:placeholder:text-[#8e918f] focus:outline-none shadow-xs transition-all"
          />
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Open Command Palette (Ctrl+K or ⌘K)"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-[#2e3133] hover:bg-slate-300 text-slate-500 dark:text-[#c4c7c5] text-[11px] font-mono transition-colors"
          >
            <Command className="w-2.5 h-2.5" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Right Control Icons (Matching Google Photos Screenshot 3) */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* + Create / Upload Button */}
        <div className="relative">
          <button
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            title="Create & Upload (+)"
            className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          {showCreateMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1e1f20] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333538] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => {
                  setShowCreateMenu(false);
                  fileInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors"
              >
                <UploadCloud className="w-4 h-4 text-sky-500" />
                <span>Upload Photos & Videos</span>
              </button>
              <button
                onClick={() => {
                  setShowCreateMenu(false);
                  setIsNewAlbumOpen(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-[#e3e3e3] hover:bg-slate-100 dark:hover:bg-[#282a2c] transition-colors"
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
          className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-500' : ''}`} />
        </button>

        {/* Transfer Engine Queue Button */}
        <button
          onClick={() => setIsTransfersOpen(true)}
          title="Transfer Engine & Queue"
          className="relative p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] transition-colors"
        >
          <Activity className="w-5 h-5" />
          {activeTransferCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-sky-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
              {activeTransferCount}
            </span>
          )}
        </button>

        {/* Help (?) Icon (Screenshot 3) */}
        <button
          onClick={() => setIsShortcutsOpen(true)}
          title="Help & Shortcuts (?)"
          className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Settings Gear (Screenshot 3) */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          title="Settings"
          className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Apps Grid (Screenshot 3 - 9 dots icon) */}
        <button
          onClick={cycleTheme}
          title={`Apps / Theme (${theme})`}
          className="p-2 sm:p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#282a2c] text-slate-700 dark:text-[#c4c7c5] hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* Circular User Avatar (Screenshot 3) */}
        {session ? (
          <div className="flex items-center gap-2 pl-1">
            <div
              onClick={() => {
                if (confirm('Log out from Telegram and wipe all local photo metadata?')) {
                  logout();
                }
              }}
              title={`Logged in as ${session.userName || session.phone || 'User'}. Click to Log Out.`}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-md cursor-pointer hover:ring-2 hover:ring-sky-400 transition-all"
            >
              {userInitial}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="text-xs font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white px-4 py-1.5 rounded-full shadow-sm transition-colors"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Single-Tab Conflict Warning Banner */}
      {isAnotherTabActive && (
        <div className="absolute top-16 inset-x-0 bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg z-30">
          <AlertCircle className="w-4 h-4" />
          <span>Another browser tab is actively connected. To protect session state, this tab is in read-only mode.</span>
        </div>
      )}
    </header>
  );
};
