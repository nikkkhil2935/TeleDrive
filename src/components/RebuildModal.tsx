import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import { getTelegramClient, rebuildIndexFromChannel } from '../services/tgClient';

export const RebuildModal: React.FC = () => {
  const { isRebuildModalOpen, setIsRebuildModalOpen, session } = useApp();
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(0);
  const [indexed, setIndexed] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isRebuildModalOpen) return null;

  const handleStartRebuild = async () => {
    if (!session?.channelId) {
      setError('No active library channel linked to session.');
      return;
    }

    setIsScanning(true);
    setError(null);
    setIsDone(false);
    setScanned(0);
    setIndexed(0);

    try {
      const client = await getTelegramClient();
      const res = await rebuildIndexFromChannel(client, session.channelId, (s, idx) => {
        setScanned(s);
        setIndexed(idx);
      });
      setScanned(res.totalScanned);
      setIndexed(res.totalIndexed);
      setIsDone(true);
    } catch (err: any) {
      console.warn('Real rebuild attempt, falling back to simulated counter if channel is empty:', err);
      // If channel is newly created or empty, show clean message
      if (err.message && err.message.includes('No Telegram credentials')) {
        setError('Please sign in with Telegram first to scan your channel.');
      } else {
        setError(err.message || 'Could not scan channel.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl text-slate-900 dark:text-slate-100 transition-colors">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-500 dark:text-sky-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Rebuild Index from Telegram</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Telegram is your source of truth</p>
            </div>
          </div>
          <button
            onClick={() => setIsRebuildModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300">
          <p className="leading-relaxed">
            If you clear browser data, switch devices, or re-index your media, this scans messages in your private library channel, parses their embedded caption JSON, and restores your entire photo library without data loss.
          </p>

          {isScanning && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-sky-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scanning Channel Messages...
                </span>
                <span className="text-slate-500 dark:text-slate-400">{scanned} messages read</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(15, (scanned / 100) * 100))}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Found and indexed {indexed} photos & videos with caption metadata.
              </div>
            </div>
          )}

          {isDone && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <div className="font-semibold text-xs">Index Rebuild Complete!</div>
                <div className="text-[11px] text-emerald-600/90 dark:text-emerald-300/80">
                  Successfully reconstructed {indexed} items from your Telegram channel.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsRebuildModalOpen(false)}
              className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartRebuild}
              disabled={isScanning}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {isScanning ? 'Scanning...' : 'Start Rebuild'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
