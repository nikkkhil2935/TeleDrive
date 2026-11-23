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
  Check,
  Palette,
  Gauge,
  LayoutGrid,
  Layers,
  Sparkles,
  Cpu,
  Activity,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { FramelyLogo } from './FramelyLogo';
import { useApp } from '../context/AppContext';
import { getTelegramClient, clearFullMediaUrlCache } from '../services/tgClient';
import { transferQueue } from '../services/transferQueue';
import {
  hasEncryptedVault,
  saveVaultSession,
  executePanicWipe
} from '../services/vaultService';
import { BrandAccent } from '../context/AppContext';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    theme,
    setTheme,
    brandAccent,
    setBrandAccent,
    gridDensity,
    setGridDensity,
    session,
    logout,
    panicWipe,
    setIsRebuildModalOpen
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customization' | 'speed' | 'security'>('customization');
  const [concurrency, setConcurrency] = useState<number>(transferQueue.getMaxConcurrency());
  const [cacheCleared, setCacheCleared] = useState(false);
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

  const accentOptions: { id: BrandAccent; name: string; lightColor: string; darkColor: string; bgClass: string }[] = [
    { id: 'blue', name: 'Google Blue', lightColor: '#0B57D0', darkColor: '#A8C7FA', bgClass: 'bg-blue-500' },
    { id: 'indigo', name: 'Electric Indigo', lightColor: '#4F46E5', darkColor: '#818CF8', bgClass: 'bg-indigo-500' },
    { id: 'teal', name: 'Telegram Teal', lightColor: '#0D9488', darkColor: '#2DD4BF', bgClass: 'bg-teal-500' },
    { id: 'coral', name: 'Sunset Coral', lightColor: '#E11D48', darkColor: '#FB7185', bgClass: 'bg-rose-500' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="t-modal-content bg-white dark:bg-[#1E1F20] dark:midnight:bg-[#0A0A0A] border border-slate-200/90 dark:border-white/[0.08] rounded-[28px] max-w-2xl w-full overflow-hidden shadow-[0_25px_65px_-12px_rgba(0,0,0,0.5)] flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Pure Framely Logo - No Enclosing Box */}
            <div className="shrink-0 hover:rotate-12 transition-transform duration-300">
              <FramelyLogo className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#1F1F1F] dark:text-[#F1F3F4]">
                Settings & Preferences
              </h2>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
                Appearance, MTProto performance & zero-knowledge security
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Close settings"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tactile Segmented Navigation Tabs */}
        <div className="px-5 sm:px-7 pt-3.5 pb-2 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#131314]/80">
          <div className="p-1 bg-slate-200/70 dark:bg-[#1A1B1C] rounded-2xl border border-slate-300/40 dark:border-white/[0.06] grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('customization')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer ${
                activeTab === 'customization'
                  ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.04] dark:border-white/[0.06]'
                  : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white font-medium'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customization</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('speed')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer ${
                activeTab === 'speed'
                  ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.04] dark:border-white/[0.06]'
                  : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white font-medium'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Speed Engine</span>
              <span className="px-1.5 py-0.2 rounded-md bg-sky-500/10 dark:bg-sky-400/15 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                {concurrency}x
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-white dark:bg-[#282A2C] text-[#0B57D0] dark:text-[#A8C7FA] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/[0.04] dark:border-white/[0.06]'
                  : 'text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white font-medium'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Security Center</span>
              <span className={`w-2 h-2 rounded-full ${hasEncryptedVault() ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-7 space-y-7 overflow-y-auto max-h-[66vh] text-xs">
          
          {/* TAB 1: CUSTOMIZATION */}
          {activeTab === 'customization' && (
            <div className="space-y-6">
              
              {/* Section 1: Theme & Visual Experience */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-sm text-[#1F1F1F] dark:text-[#F1F3F4] flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Theme & Visual Experience</span>
                  </label>
                  <span className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                    Real-time interface preview
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Light Theme Card */}
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`group relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      theme === 'light'
                        ? 'border-[#0B57D0] ring-2 ring-[#0B57D0]/30 bg-blue-50/40 dark:bg-blue-500/10 shadow-sm'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-[#161718]'
                    }`}
                  >
                    {/* Miniature UI Preview */}
                    <div className="w-full h-18 rounded-xl bg-white border border-slate-200 p-1.5 flex flex-col justify-between shadow-xs overflow-hidden">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                        <div className="w-10 h-1.5 rounded-full bg-blue-500/20" />
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-0.5">
                        <div className="h-8 rounded-sm bg-gradient-to-br from-sky-400 to-blue-500" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-amber-300 to-orange-400" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-emerald-300 to-teal-500" />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5">
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Light</span>
                        </div>
                        <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">Clean Day</p>
                      </div>
                      {theme === 'light' && (
                        <div className="w-4 h-4 rounded-full bg-[#0B57D0] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Dark Theme Card (Google) */}
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`group relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      theme === 'dark'
                        ? 'border-[#A8C7FA] ring-2 ring-[#A8C7FA]/30 bg-blue-500/10 dark:bg-[#004A77]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-[#161718]'
                    }`}
                  >
                    {/* Miniature UI Preview */}
                    <div className="w-full h-18 rounded-xl bg-[#1E1F20] border border-[#3C4043] p-1.5 flex flex-col justify-between shadow-xs overflow-hidden">
                      <div className="flex items-center justify-between pb-1 border-b border-[#2D2F31]">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5F6368]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5F6368]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#5F6368]" />
                        </div>
                        <div className="w-10 h-1.5 rounded-full bg-[#A8C7FA]/30" />
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-0.5">
                        <div className="h-8 rounded-sm bg-gradient-to-br from-indigo-700 to-blue-600" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-purple-800 to-pink-600" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-amber-700 to-rose-700" />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5">
                          <Moon className="w-3.5 h-3.5 text-sky-400" />
                          <span>Dark (Google)</span>
                        </div>
                        <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">#1E1F20 Gray</p>
                      </div>
                      {theme === 'dark' && (
                        <div className="w-4 h-4 rounded-full bg-[#A8C7FA] text-[#041E49] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* OLED Pure Midnight */}
                  <button
                    type="button"
                    onClick={() => setTheme('midnight')}
                    className={`group relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      theme === 'midnight'
                        ? 'border-sky-400 ring-2 ring-sky-400/30 bg-black shadow-sm'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-[#161718]'
                    }`}
                  >
                    {/* Miniature UI Preview */}
                    <div className="w-full h-18 rounded-xl bg-black border border-[#222222] p-1.5 flex flex-col justify-between shadow-xs overflow-hidden">
                      <div className="flex items-center justify-between pb-1 border-b border-[#181818]">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#444444]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#444444]" />
                        </div>
                        <div className="w-10 h-1.5 rounded-full bg-cyan-400/30" />
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-0.5">
                        <div className="h-8 rounded-sm bg-gradient-to-br from-cyan-600 to-blue-700" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-rose-900 to-orange-700" />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 rounded-full bg-black border border-cyan-400/60" />
                          <span>OLED Pure</span>
                        </div>
                        <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">#000000 Black</p>
                      </div>
                      {theme === 'midnight' && (
                        <div className="w-4 h-4 rounded-full bg-sky-400 text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* System Theme Card */}
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`group relative p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      theme === 'system'
                        ? 'border-[#0B57D0] dark:border-[#A8C7FA] ring-2 ring-[#0B57D0]/30 dark:ring-[#A8C7FA]/30 bg-blue-50/40 dark:bg-[#004A77]/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 bg-slate-50/50 dark:bg-[#161718]'
                    }`}
                  >
                    {/* Miniature UI Preview (Split Light/Dark) */}
                    <div className="w-full h-18 rounded-xl border border-slate-200 dark:border-[#3C4043] p-1.5 flex flex-col justify-between shadow-xs overflow-hidden relative">
                      <div className="absolute inset-0 flex">
                        <div className="w-1/2 bg-white" />
                        <div className="w-1/2 bg-[#1E1F20]" />
                      </div>
                      <div className="relative z-10 flex items-center justify-between pb-1 border-b border-slate-200/80 dark:border-[#2D2F31]">
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#5F6368]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#5F6368]" />
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#5F6368]" />
                        </div>
                        <div className="w-10 h-1.5 rounded-full bg-blue-500/20 dark:bg-[#A8C7FA]/30" />
                      </div>
                      <div className="relative z-10 grid grid-cols-3 gap-1 pt-0.5">
                        <div className="h-8 rounded-sm bg-gradient-to-br from-sky-400 to-blue-500" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-amber-400 to-orange-500" />
                        <div className="h-8 rounded-sm bg-gradient-to-br from-indigo-700 to-purple-700" />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-slate-400" />
                          <span>System</span>
                        </div>
                        <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">Auto Match OS</p>
                      </div>
                      {theme === 'system' && (
                        <div className="w-4 h-4 rounded-full bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>

                </div>
              </div>

              {/* Section 2: Brand Accent Color */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-sm text-[#1F1F1F] dark:text-[#F1F3F4] flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    <span>Brand Accent Color</span>
                  </label>
                  <span className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                    Active highlight tint
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {accentOptions.map((acc) => {
                    const isSelected = brandAccent === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setBrandAccent(acc.id)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-slate-400 dark:border-white/30 bg-slate-100 dark:bg-white/[0.08] shadow-xs'
                            : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-5 h-5 rounded-full ${acc.bgClass} shadow-xs ring-2 ${isSelected ? 'ring-offset-2 ring-offset-white dark:ring-offset-[#1E1F20] ring-slate-400 dark:ring-white/50' : 'ring-transparent'}`} />
                          <span className="font-medium text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
                            {acc.name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#1F1F1F] dark:text-white stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Gallery Grid Density */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-sm text-[#1F1F1F] dark:text-[#F1F3F4] flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-emerald-500" />
                    <span>Gallery Grid Density</span>
                  </label>
                  <span className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                    Photo column sizing
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Dense */}
                  <button
                    type="button"
                    onClick={() => setGridDensity('small')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      gridDensity === 'small'
                        ? 'border-[#0B57D0] dark:border-[#A8C7FA] ring-2 ring-[#0B57D0]/20 dark:ring-[#A8C7FA]/20 bg-blue-50/40 dark:bg-[#004A77]/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#161718]'
                    }`}
                  >
                    {/* Micro Grid Graphic */}
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/[0.04] grid grid-cols-4 gap-1 h-14 items-center">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-4 rounded-xs bg-slate-300 dark:bg-white/20" />
                      ))}
                    </div>
                    <div className="mt-2.5">
                      <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center justify-between">
                        <span>Dense</span>
                        {gridDensity === 'small' && <Check className="w-3.5 h-3.5 text-[#0B57D0] dark:text-[#A8C7FA]" />}
                      </div>
                      <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">6–9 columns (Compact)</p>
                    </div>
                  </button>

                  {/* Standard */}
                  <button
                    type="button"
                    onClick={() => setGridDensity('medium')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      gridDensity === 'medium'
                        ? 'border-[#0B57D0] dark:border-[#A8C7FA] ring-2 ring-[#0B57D0]/20 dark:ring-[#A8C7FA]/20 bg-blue-50/40 dark:bg-[#004A77]/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#161718]'
                    }`}
                  >
                    {/* Micro Grid Graphic */}
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/[0.04] grid grid-cols-3 gap-1.5 h-14 items-center">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-4.5 rounded-xs bg-slate-300 dark:bg-white/20" />
                      ))}
                    </div>
                    <div className="mt-2.5">
                      <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center justify-between">
                        <span>Standard</span>
                        {gridDensity === 'medium' && <Check className="w-3.5 h-3.5 text-[#0B57D0] dark:text-[#A8C7FA]" />}
                      </div>
                      <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">4–6 columns (Default)</p>
                    </div>
                  </button>

                  {/* Large */}
                  <button
                    type="button"
                    onClick={() => setGridDensity('large')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      gridDensity === 'large'
                        ? 'border-[#0B57D0] dark:border-[#A8C7FA] ring-2 ring-[#0B57D0]/20 dark:ring-[#A8C7FA]/20 bg-blue-50/40 dark:bg-[#004A77]/30 shadow-xs'
                        : 'border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-[#161718]'
                    }`}
                  >
                    {/* Micro Grid Graphic */}
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-black/30 border border-slate-200/60 dark:border-white/[0.04] grid grid-cols-2 gap-2 h-14 items-center">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-5 rounded-xs bg-slate-300 dark:bg-white/20" />
                      ))}
                    </div>
                    <div className="mt-2.5">
                      <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center justify-between">
                        <span>Spacious</span>
                        {gridDensity === 'large' && <Check className="w-3.5 h-3.5 text-[#0B57D0] dark:text-[#A8C7FA]" />}
                      </div>
                      <p className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">2–4 columns (Detail)</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Section 4: Index & Maintenance */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161718] border border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/15 text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#1F1F1F] dark:text-[#F1F3F4]">
                        Rebuild Library Index
                      </h4>
                      <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5 max-w-sm">
                        Rescan Telegram channel history to discover newly uploaded photos, repair corrupted index keys, and sync album tags.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsRebuildModalOpen(true);
                    }}
                    className="gp-btn-tonal py-2 px-4 text-xs font-semibold shrink-0 cursor-pointer w-full sm:w-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Scan Channel</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SPEED ENGINE */}
          {activeTab === 'speed' && (
            <div className="space-y-5">
              
              {/* High-Throughput Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-sky-500/5 to-transparent border border-sky-400/30 dark:border-sky-400/20 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#0B57D0] dark:text-[#A8C7FA] text-sm">
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Direct MTProto WebSockets (WSS) Protocol</span>
                </div>
                <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] leading-relaxed">
                  Framely streams encrypted media chunks directly between your browser and Telegram data centers via MTProto WebSockets. There are no intermediate proxy servers, zero analytics leaks, and no throttling bottlenecks.
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-semibold">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Zero Middlemen
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    512 KB Slices
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Multi-DC Routing
                  </span>
                </div>
              </div>

              {/* Parallel Concurrency Selector */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-3.5 bg-slate-50/50 dark:bg-[#161718]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3]">
                      Parallel Upload Streams
                    </span>
                    <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
                      Adjust concurrent worker queues for your internet connection
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/15 text-[#0B57D0] dark:text-[#A8C7FA] font-bold text-xs">
                    {concurrency} Active {concurrency === 1 ? 'Stream' : 'Streams'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { num: 1, label: 'Conservative', note: 'Mobile data' },
                    { num: 2, label: 'Balanced', note: 'Recommended' },
                    { num: 3, label: 'High-Speed', note: 'Fast Wi-Fi' },
                    { num: 4, label: 'Turbo MTProto', note: 'Gigabit Fiber' },
                  ].map(({ num, label, note }) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setConcurrency(num);
                        transferQueue.setMaxConcurrency(num);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                        concurrency === num
                          ? 'border-[#0B57D0] dark:border-[#A8C7FA] bg-white dark:bg-[#004A77]/40 text-[#0B57D0] dark:text-[#C2E7FF] font-semibold shadow-xs'
                          : 'border-slate-200 dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.04] text-[#5F6368] dark:text-[#9AA0A6]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                        <Gauge className="w-3.5 h-3.5" />
                        <span>{num}x</span>
                      </div>
                      <div className="mt-1">
                        <div className="text-[11px] font-medium">{label}</div>
                        <div className="text-[9px] opacity-75">{note}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Protocol Spec Telemetry */}
              <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] space-y-3 bg-slate-50/50 dark:bg-[#161718]">
                <div className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-500" />
                  <span>Protocol Engine Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#1E1F20] border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider font-semibold">Chunk Part Size</span>
                    <p className="text-xs font-bold text-emerald-500 mt-1">512 KB Cap</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Maximum MTProto rate</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#1E1F20] border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider font-semibold">Memory Streaming</span>
                    <p className="text-xs font-bold text-indigo-400 mt-1">Zero-Copy ArrayBuffer</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">On-demand memory slicing</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#1E1F20] border border-slate-200/80 dark:border-white/[0.06]">
                    <span className="text-[10px] text-[#5F6368] dark:text-[#9AA0A6] uppercase tracking-wider font-semibold">Blob URL Cache</span>
                    <p className="text-xs font-bold text-sky-400 mt-1">Direct Memory Pool</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Instant image rendering</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between">
                  <div className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6]">
                    Free up browser memory if viewer feels sluggish:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearFullMediaUrlCache();
                      setCacheCleared(true);
                      setTimeout(() => setCacheCleared(false), 2500);
                    }}
                    className="py-1.5 px-3.5 rounded-full text-xs font-semibold border border-slate-200 dark:border-white/[0.1] hover:bg-white dark:hover:bg-white/[0.08] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {cacheCleared ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Cache Purged!</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Purge Image Cache</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: SECURITY CENTER */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              
              {/* Vault Encryption Status */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#161718] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-400/15 text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#1F1F1F] dark:text-[#F1F3F4]">
                        Zero-Knowledge Session Encryption
                      </h4>
                      <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
                        Client-side PBKDF2 (100k iters) + AES-256-GCM vault
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    hasEncryptedVault()
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}>
                    {hasEncryptedVault() ? 'AES-256-GCM Encrypted' : 'Unencrypted Session'}
                  </span>
                </div>

                <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] leading-relaxed">
                  When enabled, your Telegram MTProto session authorization is wrapped in hardware-accelerated AES-256-GCM ciphertext. It can never be read from disk without your master passphrase.
                </p>

                {/* Set or Change Vault Passphrase */}
                <form onSubmit={handleSetVaultPassphrase} className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Vault Passphrase (min 6 chars)"
                        value={newPassphrase}
                        onChange={(e) => setNewPassphrase(e.target.value)}
                        className="w-full bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Confirm Passphrase"
                        value={confirmPassphrase}
                        onChange={(e) => setConfirmPassphrase(e.target.value)}
                        className="w-full bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-white/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                      />
                    </div>
                  </div>

                  {vaultError && (
                    <div className="text-rose-500 text-[11px] font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{vaultError}</span>
                    </div>
                  )}
                  {vaultSuccess && (
                    <div className="text-emerald-500 text-[11px] font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Vault successfully encrypted with AES-256-GCM!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#1F1F1F] dark:hover:text-white text-[11px] flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPass ? 'Hide Passphrase' : 'Show Passphrase'}</span>
                    </button>

                    <button
                      type="submit"
                      disabled={!newPassphrase || newPassphrase.length < 6}
                      className="gp-btn-primary py-1.5 px-4 text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {hasEncryptedVault() ? 'Update Vault Key' : 'Encrypt Session at Rest'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Sessions Management */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#161718] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#1F1F1F] dark:text-[#F1F3F4]">
                        Telegram Authorizations & Devices
                      </h4>
                      <p className="text-[11px] text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
                        Inspect and revoke active client sessions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleFetchActiveSessions}
                    disabled={isLoadingSessions}
                    className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] hover:underline font-semibold cursor-pointer"
                  >
                    {isLoadingSessions ? 'Inspecting...' : 'Inspect Devices'}
                  </button>
                </div>

                {sessionsMsg && (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-[#0B57D0] dark:text-[#A8C7FA] text-[11px] font-medium">
                    {sessionsMsg}
                  </div>
                )}

                {sessionsList.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-white/[0.06]">
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {sessionsList.map((auth, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white dark:bg-[#1E1F20] border border-slate-200/80 dark:border-white/[0.06] text-[11px] flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                              {auth.deviceModel} ({auth.appName})
                            </div>
                            <div className="text-[#5F6368] dark:text-[#9AA0A6] mt-0.5">
                              {auth.ip} · {auth.country || 'Unknown location'}
                            </div>
                          </div>
                          {auth.current ? (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                              Current Session
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                              Active Remote
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleTerminateOtherSessions}
                      className="w-full py-2.5 px-4 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-semibold text-xs border border-rose-500/20 transition-colors cursor-pointer"
                    >
                      Terminate All Other Telegram Sessions
                    </button>
                  </div>
                )}
              </div>

              {/* Danger Zone: Panic Wipe & Log Out */}
              <div className="p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Nuclear Panic Wipe (Emergency Zeroize)</span>
                </div>
                <p className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF] leading-normal">
                  Instantly zeroizes all local indexed databases, in-memory caches, and session encryption keys with zero residual trace left on this device.
                </p>
                <button
                  type="button"
                  onClick={handlePanicWipe}
                  className="w-full py-2.5 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                >
                  Panic Wipe (Instant Zeroize)
                </button>
              </div>

              {/* True Logout */}
              {session && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#1E1F20] dark:hover:bg-[#282A2C] text-rose-500 font-semibold text-xs border border-slate-200 dark:border-white/[0.08] transition-colors flex items-center justify-center gap-2 cursor-pointer"
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
