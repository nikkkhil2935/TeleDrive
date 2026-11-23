import React, { useState } from 'react';
import {
  Users,
  FolderPlus,
  Share2,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Radio,
  Lock,
  MessageSquare
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';

export const SharingView: React.FC = () => {
  const { session, setIsNewAlbumOpen } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);

  const activeScope = session?.channelId || session?.userId || 'me';

  const albums = useLiveQuery(
    async () => {
      return await db.albums.toArray();
    },
    [],
    []
  );

  const channelTitle = session?.channelTitle || 'Framely Photos Library';
  const channelDisplayId = session?.channelId ? `#${session.channelId}` : 'Saved Messages';
  const shareUrl = window.location.origin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-[#F8FAFD] dark:bg-[#131314] select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#444746]/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#0B57D0] dark:text-[#A8C7FA]" />
            <span>Sharing</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#C2C7CF] mt-1">
            Manage shared albums, partner libraries, and Telegram cloud connections.
          </p>
        </div>

        <button
          onClick={() => setIsNewAlbumOpen(true)}
          className="gp-btn-primary flex items-center gap-2 text-xs py-2 px-4 shadow-sm"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Create Shared Album</span>
        </button>
      </div>

      {/* Telegram Storage Channel Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/15 text-[#0B57D0] dark:text-[#A8C7FA] flex items-center justify-center font-bold">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                  {channelTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Cloud
                </span>
              </div>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] mt-0.5">
                Telegram Channel ID: {channelDisplayId}
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="gp-btn-tonal text-xs py-2 px-3 flex items-center gap-1.5 shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied' : 'Share App Link'}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-[#444746]/40 flex flex-wrap items-center justify-between text-xs text-[#5F6368] dark:text-[#C2C7CF] gap-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Zero-Middleman Direct MTProto: Only your authorized Telegram session can read or write.</span>
          </span>
          <span className="font-mono text-[11px] text-[#0B57D0] dark:text-[#A8C7FA]">
            MTProto WSS Encrypted
          </span>
        </div>
      </div>

      {/* Shared Albums Section */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
          Shared Albums
        </h2>

        {albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {albums.map((album) => (
              <div
                key={album.id}
                className="p-4 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                    {album.name}
                  </span>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <p className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF]">
                  Created {new Date(album.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/40 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#282A2C] text-slate-400 flex items-center justify-center mx-auto">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">No shared albums yet</h3>
            <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] max-w-sm mx-auto">
              Create an album to organize and share your memories seamlessly.
            </p>
            <button
              onClick={() => setIsNewAlbumOpen(true)}
              className="gp-btn-tonal text-xs py-1.5 px-3 mx-auto inline-flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Create an Album</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
