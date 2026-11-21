import React, { useRef } from 'react';
import { Image, Compass, FolderHeart, Settings, UploadCloud } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, setIsSettingsOpen, uploadFiles } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navTabs = [
    { id: 'photos', label: 'Photos', icon: Image },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'albums', label: 'Albums', icon: FolderHeart },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => setIsSettingsOpen(true) },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) for Mobile Upload above Bottom Nav (§8.1) */}
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
        title="Upload photos or videos"
        className="md:hidden fixed bottom-20 right-5 z-40 w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-xl shadow-sky-500/35 flex items-center justify-center transition-transform active:scale-95"
      >
        <UploadCloud className="w-6 h-6" />
      </button>

      {/* 4-Tab Bottom Navigation Bar (<600px Compact Layout) */}
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
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl text-[11px] font-medium transition-all ${
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
    </>
  );
};
