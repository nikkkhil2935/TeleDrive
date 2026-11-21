import React, { useState } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  ShieldAlert,
  HardDrive,
  Trash2,
  RefreshCw,
  LogOut,
  User,
  Zap,
  Lock,
  KeyRound,
  AlertTriangle,
  Smartphone,
  Eye,
  EyeOff,
  Sliders,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { getTelegramClient } from '../services/tgClient';
import {
  hasEncryptedVault,
  saveVaultSession,
  executePanicWipe
} from '../services/vaultService';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    theme,
    setTheme,
    gridDensity,
    setGridDensity,
    session,
    logout,
    lockVault,
    panicWipe,
    setIsRebuildModalOpen,
    setIsAuthModalOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customization' | 'security' | 'speed'>('customization');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [vaultSuccess, setVaultSuccess] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  // Active Telegram Sessions
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsMsg, setSessionsMsg] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  const handleSetVaultPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassphrase || newPassphrase.length < 6) {
      setVaultError('Passphrase must be at least 6 characters long.');
      return;
    }
    if (newPassphrase !== confirmPassphrase) {
      setVaultError('Passphrases do not match.');
      return;
    }
    if (!session) {
      setVaultError('You must be signed in to encrypt a session.');
      return;
    }

    try {
      await saveVaultSession(session, newPassphrase.trim());
      setVaultSuccess(true);
      setVaultError(null);
      setNewPassphrase('');
      setConfirmPassphrase('');
      setTimeout(() => setVaultSuccess(false), 3000);
    } catch (e: any) {
      setVaultError(e?.message || 'Failed to encrypt vault.');
    }
  };

  const handleFetchActiveSessions = async () => {
    setIsLoadingSessions(true);
    setSessionsMsg(null);
    try {
      const client = await getTelegramClient();
      const { Api } = await import('telegram/tl');
      const result: any = await client.invoke(new Api.account.GetAuthorizations());
      setSessionsList(result.authorizations || []);
    } catch (err: any) {
      setSessionsMsg('Could not fetch active sessions: ' + (err?.message || err));
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleTerminateOtherSessions = async () => {
    if (!confirm('Terminate all other active Telegram sessions except this one?')) return;
    try {
      const client = await getTelegramClient();
      const { Api } = await import('telegram/tl');
      await client.invoke(new Api.auth.ResetAuthorizations());
      setSessionsMsg('All other Telegram sessions successfully terminated.');
      handleFetchActiveSessions();
    } catch (err: any) {
      setSessionsMsg('Failed to terminate other sessions: ' + (err?.message || err));
    }
  };

  const handlePanicWipe = () => {
    if (confirm('CRITICAL DANGER: Nuclear Panic Wipe will instantly zeroize all local database records, session keys, and cache. Proceed?')) {
      panicWipe();
    }
  };

  const handleLogout = () => {
    if (confirm('Log out from Telegram and purge all local photos and session keys?')) {
      logout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 dark:text-sky-400 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Preferences & Security</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Customization, transfer speed & zero-knowledge security</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 text-xs font-semibold gap-2 pt-2">
          <button
            onClick={() => setActiveTab('customization')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'customization'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customization</span>
          </button>

          <button
            onClick={() => setActiveTab('speed')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'speed'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Speed Engine</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Center</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[68vh] text-xs">
          {/* TAB 1: CONSUMER CUSTOMIZATION */}
          {activeTab === 'customization' && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-800 dark:text-slate-200">Theme & Visual Experience</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                      theme === 'light'
                        ? 'border-sky-500 bg-sky-50 text-sky-600 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span className="font-medium text-[11px]">Light</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                      theme === 'dark'
                        ? 'border-sky-500 bg-sky-950/40 text-sky-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-4 h-4 text-sky-400" />
                    <span className="font-medium text-[11px]">Dark Slate</span>
                  </button>

                  <button
                    onClick={() => setTheme('midnight')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                      theme === 'midnight'
                        ? 'border-sky-500 bg-black text-sky-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-black border border-slate-700" />
                    <span className="font-medium text-[11px]">OLED Pure</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                      theme === 'system'
                        ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-[11px]">System</span>
                  </button>
                </div>
              </div>

              {/* Grid Density */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-800 dark:text-slate-200">Gallery Grid Density</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setGridDensity('small')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      gridDensity === 'small'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Compact (6-9)
                  </button>
                  <button
                    onClick={() => setGridDensity('medium')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      gridDensity === 'medium'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Standard (4-6)
                  </button>
                  <button
                    onClick={() => setGridDensity('large')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      gridDensity === 'large'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-500 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Large (2-4)
                  </button>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-semibold text-slate-800 dark:text-slate-200">Index & Rebuild</label>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    setIsRebuildModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
                >
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <RefreshCw className="w-4 h-4 text-sky-500" />
                    <span>Rebuild Index from Telegram Channel</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Full scan</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SPEED ENGINE */}
          {activeTab === 'speed' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 to-indigo-500/10 border border-sky-500/20 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-sky-500">
                  <Zap className="w-4 h-4" />
                  <span>High-Throughput Multi-Stream MTProto</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Uploads and downloads stream chunks concurrently via WebSockets directly to Telegram data centers. Zero intermediate proxy bottlenecks.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950/40">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Multi-Part Concurrency:</span>
                  <span className="font-bold text-sky-500">4 Parallel Streams</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Chunk Part Size:</span>
                  <span className="font-bold text-emerald-500">512 KB (High Speed)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">Zero-Copy File Streaming:</span>
                  <span className="font-bold text-indigo-400">Enabled (CustomBuffer on-demand slice)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">In-Memory Object URL Cache:</span>
                  <span className="font-bold text-sky-400">Active (Instant switching)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY CENTER */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Vault Encryption Status */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-sky-500" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Session Vault Encryption</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    hasEncryptedVault()
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}>
                    {hasEncryptedVault() ? 'AES-256-GCM Encrypted' : 'Unencrypted Session'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Encrypt your Telegram MTProto session key with a passphrase. When encrypted, the session can only be unwrapped in your browser with your passphrase.
                </p>

                {/* Set or Change Vault Passphrase */}
                <form onSubmit={handleSetVaultPassphrase} className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Vault Passphrase (min 6 chars)"
                      value={newPassphrase}
                      onChange={(e) => setNewPassphrase(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Confirm Passphrase"
                      value={confirmPassphrase}
                      onChange={(e) => setConfirmPassphrase(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {vaultError && (
                    <div className="text-rose-500 text-[11px] font-medium">{vaultError}</div>
                  )}
                  {vaultSuccess && (
                    <div className="text-emerald-500 text-[11px] font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Vault successfully encrypted with AES-256-GCM!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPass ? 'Hide' : 'Show'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={!newPassphrase || newPassphrase.length < 6}
                      className="py-1.5 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs disabled:opacity-50 transition-colors"
                    >
                      {hasEncryptedVault() ? 'Update Vault Key' : 'Encrypt Session at Rest'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Sessions Management */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">Telegram Authorizations & Devices</span>
                  </div>
                  <button
                    onClick={handleFetchActiveSessions}
                    disabled={isLoadingSessions}
                    className="text-xs text-sky-500 hover:text-sky-400 font-medium"
                  >
                    {isLoadingSessions ? 'Inspecting...' : 'Inspect Devices'}
                  </button>
                </div>

                {sessionsMsg && (
                  <div className="text-sky-400 text-[11px] font-medium">{sessionsMsg}</div>
                )}

                {sessionsList.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-h-36 overflow-y-auto space-y-1.5">
                      {sessionsList.map((auth, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{auth.deviceModel} ({auth.appName})</div>
                            <div className="text-slate-400">{auth.ip} · {auth.country || 'Unknown location'}</div>
                          </div>
                          {auth.current ? (
                            <span className="text-emerald-400 font-bold text-[10px]">Current Tab</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Active</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleTerminateOtherSessions}
                      className="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition-colors"
                    >
                      Terminate All Other Telegram Sessions
                    </button>
                  </div>
                )}
              </div>

              {/* Nuclear Panic Wipe Button */}
              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Nuclear Panic Wipe</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-normal">
                  Instantly zeroizes all local databases, cache, and session keys with zero trace left on this device.
                </p>
                <button
                  onClick={handlePanicWipe}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all"
                >
                  Panic Wipe (Instant Zeroize)
                </button>
              </div>

              {/* True Logout */}
              {session && (
                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-500 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out & Purge Local Data</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
