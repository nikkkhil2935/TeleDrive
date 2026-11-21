import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { transferQueue } from '../services/transferQueue';

export const UploadBanner: React.FC = () => {
  const { activeJobs } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (activeJobs.length === 0) return null;

  const currentJob = activeJobs[0];
  const isCooldown = currentJob.status === 'cooldown' && currentJob.cooldownUntil && currentJob.cooldownUntil > now;
  const cooldownRemainingSec = isCooldown ? Math.round((currentJob.cooldownUntil! - now) / 1000) : 0;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-30 max-w-md bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="p-4 flex items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          {isCooldown ? (
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 animate-pulse" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}

          <div className="truncate">
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-2">
              <span>{isCooldown ? `Telegram Rate Limit (Flood Wait)` : `Uploading Media...`}</span>
              <span className="text-[10px] text-sky-400 font-normal">
                {activeJobs.length} {activeJobs.length === 1 ? 'file' : 'files'} in queue
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {isCooldown ? (
                <span className="text-amber-400 font-medium">Cooldown active: resuming in {cooldownRemainingSec}s</span>
              ) : (
                <span>{currentJob.filename} ({Math.round(currentJob.progress * 100)}%)</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className={`h-full transition-all duration-300 ${isCooldown ? 'bg-amber-500' : 'bg-gradient-to-r from-sky-400 to-indigo-500'}`}
          style={{ width: `${Math.round(currentJob.progress * 100)}%` }}
        />
      </div>

      {/* Expanded Job List */}
      {isExpanded && (
        <div className="max-h-60 overflow-y-auto p-3 space-y-2 divide-y divide-slate-800/60">
          {activeJobs.map(job => (
            <div key={job.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-slate-300 truncate max-w-[200px]">{job.filename}</span>
                <span className="text-[10px] text-slate-500">
                  {job.status === 'uploading' ? `${Math.round(job.progress * 100)}%` : job.status}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                {(job.sizeBytes / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
