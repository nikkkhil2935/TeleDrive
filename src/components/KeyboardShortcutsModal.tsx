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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors"
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-500 flex items-center justify-center font-bold">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Power user quick keys</p>
            </div>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
            >
              <span className="text-slate-600 dark:text-slate-300">{s.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center bg-slate-50/50 dark:bg-slate-950/40">
          Press <b>Esc</b> anytime to dismiss
        </div>
      </div>
    </div>
  );
};
