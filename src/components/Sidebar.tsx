import React from 'react';
import {
  Image,
  Compass,
  Heart,
  FolderHeart,
  Archive,
  Trash2,
  PieChart,
  Copy,
  ShieldCheck,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsStorageModalOpen,
    setIsDuplicatesOpen,
    setIsPrivacyOpen,
    setIsOnboardingOpen,
  } = useApp();

  const navItems = [
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'favorites', label: 'Favorites', icon: Heart },
  ];

  const libraryItems = [
    { id: 'albums', label: 'Albums', icon: FolderHeart },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <aside className="hidden md:flex w-20 lg:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-3 lg:p-4 flex-col justify-between select-none transition-all duration-200 shrink-0">
      <div className="space-y-6">
        {/* Core Nav */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`w-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3.5 px-2 lg:px-3.5 py-2.5 rounded-2xl text-xs lg:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/80'
                }`}
              >
                <Icon className={`w-5 h-5 lg:w-4 lg:h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Collections */}
        <div className="space-y-1.5">
          <div className="hidden lg:block px-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Collections
          </div>
          <nav className="space-y-1">
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3.5 px-2 lg:px-3.5 py-2.5 rounded-2xl text-xs lg:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-5 h-5 lg:w-4 lg:h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Utilities */}
        <div className="space-y-1.5">
          <div className="hidden lg:block px-3.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Utilities
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setIsDuplicatesOpen(true)}
              title="Duplicate Finder"
              className="w-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3.5 px-2 lg:px-3.5 py-2.5 rounded-2xl text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 transition-all"
            >
              <Copy className="w-5 h-5 lg:w-4 lg:h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="truncate">Duplicates</span>
            </button>
            <button
              onClick={() => setIsPrivacyOpen(true)}
              title="Privacy & How Stored"
              className="w-full flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3.5 px-2 lg:px-3.5 py-2.5 rounded-2xl text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/80 transition-all"
            >
              <ShieldCheck className="w-5 h-5 lg:w-4 lg:h-4 text-emerald-500 shrink-0" />
              <span className="truncate">Privacy & Trust</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Storage Indicator & Legal Disclaimer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
        <button
          onClick={() => setIsStorageModalOpen(true)}
          title="Storage Insights"
          className="w-full text-left p-2.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <PieChart className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="hidden lg:inline">Storage</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 hidden lg:inline">Cloud</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full w-[35%]" />
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 hidden lg:block">
            Stored in private Telegram cloud
          </div>
        </button>

        {/* Legal Disclaimer Line (§1) */}
        <div className="hidden lg:block text-[9.5px] leading-tight text-slate-400 dark:text-slate-500 px-1 select-text">
          Stores files in your own Telegram account. Not affiliated with Telegram or Google.
        </div>
      </div>
    </aside>
  );
};
