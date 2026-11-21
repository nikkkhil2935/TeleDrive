import React from 'react';
import { Image, Compass, Heart, FolderHeart, Archive, Trash2, PieChart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, setIsStorageModalOpen } = useApp();

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
    <aside className="w-60 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 flex flex-col justify-between select-none transition-colors">
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
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Collections */}
        <div className="space-y-2">
          <div className="px-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-900/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Storage Indicator */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
        <button
          onClick={() => setIsStorageModalOpen(true)}
          className="w-full text-left p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <PieChart className="w-3.5 h-3.5 text-sky-500" /> Storage
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Telegram Cloud</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full w-[24%]" />
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
            Stored in private channel documents
          </div>
        </button>
      </div>
    </aside>
  );
};
