import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = useApp();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K / ⌘K', desc: 'Open Command Palette' },
    { key: 'Ctrl + L / ⌘L', desc: 'Instant Lock Vault (clears keys from RAM)' },
    { key: '?', desc: 'Show Keyboard Shortcuts' },
    { key: 'Esc', desc: 'Close Full-Screen Viewer / Active Modal' },
    { key: '← / →', desc: 'Navigate Previous / Next Photo in Viewer' },
    { key: 'F', desc: 'Toggle Favorite for selected / viewed photo' },
    { key: 'Delete / ⌫', desc: 'Move photo(s) to Trash' },
    { key: 'Space', desc: 'Toggle Full-Screen / Zoom' },
  ];

  return (
    <div
      onClick={() => setIsShortcutsOpen(false)}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="t-modal-content bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center font-bold">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Keyboard Shortcuts</h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">Power user quick keys</p>
            </div>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-[#F8FAFD] dark:bg-[#131314] text-xs border border-slate-200 dark:border-[#444746]/30"
            >
              <span className="text-[#1F1F1F] dark:text-[#E3E3E3]">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-full bg-white dark:bg-[#282A2C] border border-slate-200 dark:border-[#444746]/60 font-mono text-[11px] font-semibold text-[#0B57D0] dark:text-[#A8C7FA] shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-[#444746]/40 text-[11px] text-[#5F6368] dark:text-[#C2C7CF] text-center bg-[#F8FAFD] dark:bg-[#131314]">
          Press <b>Esc</b> anytime to dismiss
        </div>
      </div>
    </div>
  );
};
