import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { transferQueue } from '../services/transferQueue';

export const UploadBanner: React.FC = () => {
  const { activeJobs, selectedMedia, setIsTransfersOpen } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (activeJobs.length === 0 || selectedMedia) return null;

  const currentJob = activeJobs[0];
  const isCooldown = currentJob.status === 'cooldown' && currentJob.cooldownUntil && currentJob.cooldownUntil > now;
  const cooldownRemainingSec = isCooldown ? Math.round((currentJob.cooldownUntil! - now) / 1000) : 0;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-3 left-3 sm:left-auto sm:right-6 z-30 max-w-sm w-full bg-[#FFFFFF]/95 dark:bg-[#1E1F20]/95 border border-slate-200 dark:border-[#444746]/60 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
      <div
        onClick={() => setIsTransfersOpen(true)}
        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#282A2C]/60 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          {isCooldown ? (
            <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 animate-pulse" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] text-[#0B57D0] dark:text-[#C2E7FF] flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}

          <div className="truncate min-w-0">
            <div className="text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2">
              <span>{isCooldown ? 'Telegram Rate Limit' : 'Uploading photos...'}</span>
              <span className="text-[10px] text-[#0B57D0] dark:text-[#A8C7FA] font-medium">
                {activeJobs.length} {activeJobs.length === 1 ? 'file' : 'files'}
              </span>
            </div>
            <div className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF] truncate">
              {isCooldown ? (
                <span className="text-amber-500 font-medium">Resuming in {cooldownRemainingSec}s</span>
              ) : (
                <span>{currentJob.filename} ({Math.round(currentJob.progress * 100)}%)</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-[#282A2C] transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200 dark:bg-[#333538] h-1">
        <div
          className={`h-full transition-all duration-300 ${isCooldown ? 'bg-amber-500' : 'bg-[#0B57D0] dark:bg-[#A8C7FA]'}`}
          style={{ width: `${Math.round(currentJob.progress * 100)}%` }}
        />
      </div>

      {/* Expanded Job List */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-100 dark:divide-[#444746]/30">
          {activeJobs.map(job => (
            <div key={job.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-[#1F1F1F] dark:text-[#E3E3E3] truncate max-w-[180px]">{job.filename}</span>
                <span className="text-[10px] text-[#5F6368] dark:text-[#C2C7CF]">
                  {job.status === 'uploading' ? `${Math.round(job.progress * 100)}%` : job.status}
                </span>
              </div>
              <div className="text-[10px] text-[#5F6368] dark:text-[#C2C7CF]">
                {(job.sizeBytes / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
