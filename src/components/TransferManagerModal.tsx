import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Pause,
  Play,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { transferQueue } from '../services/transferQueue';

export const TransferManagerModal: React.FC = () => {
  const { isTransfersOpen, setIsTransfersOpen, activeJobs } = useApp();
  const [tab, setTab] = useState<'uploads' | 'downloads'>('uploads');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isTransfersOpen) return null;

  const formatSpeed = (bytesSec?: number) => {
    if (!bytesSec || bytesSec <= 0) return '0 KB/s';
    const mb = bytesSec / (1024 * 1024);
    if (mb < 1) return `${(bytesSec / 1024).toFixed(1)} KB/s`;
    return `${mb.toFixed(2)} MB/s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 select-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 transition-colors">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-500 dark:text-sky-400 flex items-center justify-center font-bold">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Transfer Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Telegram MTProto upload & download queues</p>
            </div>
          </div>
          <button
            onClick={() => setIsTransfersOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filter & Actions */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('uploads')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'uploads'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Uploads ({activeJobs.length})</span>
            </button>
            <button
              onClick={() => setTab('downloads')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === 'downloads'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Downloads (0)</span>
            </button>
          </div>

          <button
            onClick={() => transferQueue.clearCompleted()}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-sky-500 flex items-center gap-1 font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Done
          </button>
        </div>

        {/* Transfers List */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-3">
          {tab === 'uploads' ? (
            activeJobs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                No active uploads in the queue.
              </div>
            ) : (
              activeJobs.map((job) => {
                const isCooldown = job.status === 'cooldown' && job.cooldownUntil && job.cooldownUntil > now;
                const cooldownSec = isCooldown ? Math.round((job.cooldownUntil! - now) / 1000) : 0;

                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {job.filename}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{(job.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                          <span>·</span>
                          <span>{job.chunksUploaded} / {job.totalChunks} parts (512 KB)</span>
                          {job.currentSpeedBytesSec && job.status === 'uploading' && (
                            <>
                              <span>·</span>
                              <span className="text-sky-500 font-mono">{formatSpeed(job.currentSpeedBytesSec)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isCooldown ? (
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Flood Wait ({cooldownSec}s)
                          </span>
                        ) : job.status === 'uploading' ? (
                          <span className="px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-500 dark:text-sky-400 text-[10px] font-semibold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading {Math.round(job.progress * 100)}%
                          </span>
                        ) : job.status === 'done' ? (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 capitalize">{job.status}</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCooldown ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-500 to-indigo-600'
                        }`}
                        style={{ width: `${Math.round(job.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
              No active downloads. Media streams progressively on demand.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Concurrency: 2 concurrent streams · 512 KB chunk size</span>
          <span className="text-sky-500 font-medium">Original bytes guaranteed</span>
        </div>
      </div>
    </div>
  );
};
