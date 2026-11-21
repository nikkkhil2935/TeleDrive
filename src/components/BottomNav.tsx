import React from 'react';
import { Image, Compass, Heart, FolderHeart, PieChart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsStorageModalOpen } = useApp();

  const navTabs = [
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'albums', label: 'Albums', icon: FolderHeart },
    { id: 'storage', label: 'Storage', icon: PieChart, action: () => setIsStorageModalOpen(true) },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-1.5 transition-colors shadow-lg">
      {navTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.action) {
                tab.action();
              } else {
                setActiveTab(tab.id);
              }
            }}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-medium transition-all ${
              isActive
                ? 'text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-full transition-transform ${isActive ? 'scale-110 bg-sky-500/10' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="mt-0.5 tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
