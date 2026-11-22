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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="t-modal-content bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Rebuild Index from Telegram</h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">Telegram is your source of truth</p>
            </div>
          </div>
          <button
            onClick={() => setIsRebuildModalOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-[#5F6368] dark:text-[#C2C7CF]">
          <p className="leading-relaxed">
            If you clear browser data, switch computers, or re-index your media, this scans messages in your private library channel, parses their embedded caption JSON, and restores your entire photo library without data loss.
          </p>

          {isScanning && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#F8FAFD] dark:bg-[#131314] border border-slate-200 dark:border-[#444746]/40">
              <div className="flex items-center justify-between text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                <span className="text-[#0B57D0] dark:text-[#A8C7FA] flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scanning Channel Messages...
                </span>
                <span className="text-[#5F6368] dark:text-[#C2C7CF]">{scanned} messages read</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-[#333538] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#0B57D0] dark:bg-[#A8C7FA] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(15, (scanned / 100) * 100))}%` }}
                />
              </div>
              <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">
                Found and indexed {indexed} photos & videos with caption metadata.
              </div>
            </div>
          )}

          {isDone && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <div>
                <div className="font-semibold text-xs text-emerald-600 dark:text-emerald-400">Index Rebuild Complete!</div>
                <div className="text-[11px] text-emerald-600/90 dark:text-emerald-300/80">
                  Successfully reconstructed {indexed} items from your Telegram channel.
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsRebuildModalOpen(false)}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#5F6368] dark:text-[#C2C7CF] hover:bg-slate-100 dark:hover:bg-[#282A2C] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleStartRebuild}
              disabled={isScanning}
              className="gp-btn-primary px-4 py-2 text-xs disabled:opacity-50 cursor-pointer"
            >
              {isScanning ? 'Scanning...' : 'Start Rebuild'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
