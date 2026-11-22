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
  ShieldCheck,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { transferQueue } from '../services/transferQueue';

export const TransferManagerModal: React.FC = () => {
  const { isTransfersOpen, setIsTransfersOpen, activeJobs, session } = useApp();
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

  const channelId = session?.channelId || 'me';
  const hasErrors = activeJobs.some(j => j.status === 'error');
  const hasDone = activeJobs.some(j => j.status === 'done');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="t-modal-content bg-[#FFFFFF] dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/60 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center font-bold shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">Transfer Engine</h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">Telegram MTProto upload & download queues</p>
            </div>
          </div>
          <button
            onClick={() => setIsTransfersOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filter & Actions */}
        <div className="px-5 py-2.5 border-b border-slate-100 dark:border-[#444746]/40 flex items-center justify-between bg-[#F8FAFD] dark:bg-[#131314]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('uploads')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                tab === 'uploads'
                  ? 'bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] shadow-xs'
                  : 'text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-white'
              }`}
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              <span>Uploads ({activeJobs.length})</span>
            </button>
            <button
              onClick={() => setTab('downloads')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                tab === 'downloads'
                  ? 'bg-[#0B57D0] dark:bg-[#A8C7FA] text-white dark:text-[#041E49] shadow-xs'
                  : 'text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#1F1F1F] dark:hover:text-white'
              }`}
            >
              <ArrowDownCircle className="w-3.5 h-3.5" />
              <span>Downloads (0)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {hasDone && (
              <button
                onClick={() => transferQueue.clearCompleted()}
                className="text-xs text-[#5F6368] dark:text-[#C2C7CF] hover:text-[#0B57D0] dark:hover:text-[#A8C7FA] flex items-center gap-1 font-medium transition-colors px-2 py-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-[#282A2C]"
                title="Clear completed uploads"
              >
                <Trash2 className="w-3 h-3" /> Clear Done
              </button>
            )}

            {hasErrors && (
              <button
                onClick={() => transferQueue.retryFailedJobs(channelId)}
                className="text-xs text-[#0B57D0] dark:text-[#A8C7FA] hover:underline flex items-center gap-1 font-medium transition-colors px-2 py-1 rounded-full hover:bg-sky-500/10"
                title="Retry all failed uploads"
              >
                <RefreshCw className="w-3 h-3" /> Retry All
              </button>
            )}

            <button
              onClick={() => transferQueue.clearAll()}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium transition-colors px-2 py-1 rounded-full hover:bg-rose-500/10"
              title="Clear entire queue"
            >
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          </div>
        </div>

        {/* Transfers List */}
        <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh] space-y-2.5">
          {tab === 'uploads' ? (
            activeJobs.length === 0 ? (
              <div className="py-14 text-center text-[#5F6368] dark:text-[#C2C7CF] text-xs">
                No active uploads in the queue.
              </div>
            ) : (
              activeJobs.map((job) => {
                const isCooldown = job.status === 'cooldown' && job.cooldownUntil && job.cooldownUntil > now;
                const cooldownSec = isCooldown ? Math.round((job.cooldownUntil! - now) / 1000) : 0;
                const isError = job.status === 'error';

                return (
                  <div
                    key={job.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isError
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20'
                        : isCooldown
                        ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-[#444746]/50 bg-[#F8FAFD] dark:bg-[#282A2C]/50'
                    } space-y-2`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                          {job.filename}
                        </div>
                        <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF] flex items-center gap-2 mt-0.5">
                          <span>{(job.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                          <span>•</span>
                          <span>{job.chunksUploaded} / {job.totalChunks} parts (512 KB)</span>
                          {job.currentSpeedBytesSec && job.status === 'uploading' && (
                            <>
                              <span>•</span>
                              <span className="text-[#0B57D0] dark:text-[#A8C7FA] font-mono">{formatSpeed(job.currentSpeedBytesSec)}</span>
                            </>
                          )}
                        </div>
                        {isError && (
                          <div className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{job.error || 'Upload error. Click retry or re-upload file.'}</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badges & Quick Action */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isCooldown ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" /> Flood Wait ({cooldownSec}s)
                          </span>
                        ) : job.status === 'uploading' ? (
                          <span className="px-2.5 py-1 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] text-[10px] font-semibold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Uploading {Math.round(job.progress * 100)}%
                          </span>
                        ) : job.status === 'done' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        ) : isError ? (
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Error
                            </span>
                            <button
                              onClick={() => transferQueue.retrySingleJob(job.id, channelId)}
                              className="p-1 rounded-full hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                              title="Retry this file"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => transferQueue.removeJob(job.id)}
                              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
                              title="Remove from queue"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 capitalize px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#1E1F20]">
                            {job.status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-[#333538] rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isError
                            ? 'bg-rose-500'
                            : isCooldown
                            ? 'bg-amber-500'
                            : job.status === 'done'
                            ? 'bg-emerald-500'
                            : 'bg-[#0B57D0] dark:bg-[#A8C7FA]'
                        }`}
                        style={{ width: `${Math.round(job.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <div className="py-14 text-center text-[#5F6368] dark:text-[#C2C7CF] text-xs">
              No active downloads. Media streams progressively on demand.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#444746]/40 bg-[#F8FAFD] dark:bg-[#131314] text-[11px] text-[#5F6368] dark:text-[#C2C7CF] flex items-center justify-between">
          <span>Concurrency: 2 concurrent streams • 512 KB chunk size</span>
          <span className="text-[#0B57D0] dark:text-[#A8C7FA] font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Original bytes guaranteed
          </span>
        </div>
      </div>
    </div>
  );
};
