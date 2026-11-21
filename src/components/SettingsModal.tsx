import React from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  HardDrive,
  Trash2,
  RefreshCw,
  LogOut,
  User,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    theme,
    setTheme,
    session,
    setSession,
    setIsRebuildModalOpen,
    setIsAuthModalOpen
  } = useApp();

  if (!isSettingsOpen) return null;

  const handleClearCache = async () => {
    if (confirm('Clear local database index and thumbnails? Your original files in Telegram will remain safe.')) {
      try {
        await db.delete();
        window.location.reload();
      } catch (e) {
        console.error('Failed to delete db:', e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 dark:text-sky-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Settings</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Appearance, storage & connection</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] text-xs">
          {/* Appearance Section */}
          <div className="space-y-2.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Theme & Appearance</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  theme === 'light'
                    ? 'border-sky-500 bg-sky-50 text-sky-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span className="font-medium text-[11px]">Light</span>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  theme === 'dark'
                    ? 'border-sky-500 bg-sky-950/40 text-sky-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span className="font-medium text-[11px]">Dark</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                  theme === 'system'
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span className="font-medium text-[11px]">System</span>
              </button>
            </div>
          </div>

          {/* Account & Storage Target */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-500" />
              <span>Telegram Storage Target</span>
            </label>

            {session ? (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Account:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{session.userName || session.phone || 'Connected'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Storage Target:</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">Channel #{session.channelId}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>File Size Limit:</span>
                  <span>2,000,000,000 bytes (2 GB)</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500">Not connected to Telegram</span>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="text-sky-500 font-medium hover:underline"
                >
                  Connect Now
                </button>
              </div>
            )}
          </div>

          {/* Maintenance & Recovery */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-500" />
              <span>Maintenance & Local Cache</span>
            </label>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  setIsRebuildModalOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <RefreshCw className="w-4 h-4 text-sky-500" />
                  <span>Rebuild Index from Telegram</span>
                </div>
                <span className="text-[11px] text-slate-400">Full scan</span>
              </button>

              <button
                onClick={handleClearCache}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Local Storage Cache</span>
                </div>
                <span className="text-[11px] text-rose-500">Reset DB</span>
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/20 text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
            <div className="font-semibold flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Server Privacy Guarantee</span>
            </div>
            <p className="text-sky-700 dark:text-sky-300/80 leading-relaxed">
              Telegram Photos stores sessions only in your local browser and connects over direct WebSocket MTProto. No telemetry or server relays are used.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
