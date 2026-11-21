import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Folder, Plus, Image as ImageIcon, X } from 'lucide-react';
import { db } from '../db';
import { useApp } from '../context/AppContext';

export const AlbumsView: React.FC = () => {
  const { session, setSelectedAlbum, setActiveTab, isNewAlbumOpen, setIsNewAlbumOpen, bulkAddToAlbum } = useApp();
  const [newAlbumName, setNewAlbumName] = useState('');

  const albumsData = useLiveQuery(
    async () => {
      let allMedia = await db.media.toArray();
      if (session?.channelId) {
        allMedia = allMedia.filter(m => m.libraryId === session.channelId || (session.userId && m.libraryId === session.userId));
      } else if (!session) {
        return [];
      }
      const albumMap = new Map<string, { name: string; count: number; coverUrl?: string }>();

      // Populate from media items
      for (const m of allMedia) {
        if (m.trashedAt) continue;
        const albums = m.albums || [];
        for (const a of albums) {
          if (!albumMap.has(a)) {
            albumMap.set(a, { name: a, count: 0, coverUrl: m.thumbnailDataUrl });
          }
          const entry = albumMap.get(a)!;
          entry.count++;
          if (!entry.coverUrl && m.thumbnailDataUrl) {
            entry.coverUrl = m.thumbnailDataUrl;
          }
        }
      }

      // Also ensure albums table entries exist
      const registeredAlbums = await db.albums.toArray();
      for (const ra of registeredAlbums) {
        if (!albumMap.has(ra.name)) {
          albumMap.set(ra.name, { name: ra.name, count: 0 });
        }
      }

      return Array.from(albumMap.values());
    },
    [],
    []
  );

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;

    await db.albums.add({
      name: newAlbumName.trim(),
      createdAt: new Date().toISOString(),
    });

    // If there were selected photos, add them to the new album
    await bulkAddToAlbum(newAlbumName.trim());

    setNewAlbumName('');
    setIsNewAlbumOpen(false);
  };

  const handleSelectAlbum = (albumName: string) => {
    setSelectedAlbum(albumName);
    setActiveTab('photos');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6 space-y-6 bg-[#F8FAFD] dark:bg-[#131314]">
      {/* Header (Google Photos Album Layout) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#444746]/40">
        <div>
          <h2 className="text-xl sm:text-2xl font-medium text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
            Albums
          </h2>
          <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] mt-0.5">
            Organized in your private Telegram cloud library
          </p>
        </div>

        <button
          onClick={() => setIsNewAlbumOpen(true)}
          className="gp-btn-primary"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Album</span>
        </button>
      </div>

      {/* Albums Grid */}
      {albumsData.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#D3E3FD] dark:bg-[#004A77] flex items-center justify-center text-[#0B57D0] dark:text-[#A8C7FA] mb-3 shadow-xs">
            <Folder className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">No albums yet</h3>
          <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] max-w-sm mt-1">
            Create an album to organize your photos into custom collections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {albumsData.map((album) => (
            <div
              key={album.name}
              onClick={() => handleSelectAlbum(album.name)}
              className="group cursor-pointer space-y-2 select-none"
            >
              <div className="aspect-square rounded-2xl bg-slate-200 dark:bg-[#1E1F20] overflow-hidden relative shadow-xs group-hover:shadow-md group-hover:scale-[1.015] transition-all duration-200">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>

              <div className="px-1">
                <div className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                  {album.name}
                </div>
                <div className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">
                  {album.count} {album.count === 1 ? 'item' : 'items'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Album Modal (Google Photos Dialog Polish) */}
      {isNewAlbumOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">New Album</h3>
              <button
                onClick={() => setIsNewAlbumOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5F6368] dark:text-[#C2C7CF] mb-1.5">
                  Album title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Summer Vacation, Family & Friends"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#444746] bg-slate-50 dark:bg-[#131314] text-sm text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none focus:border-[#0B57D0] dark:focus:border-[#A8C7FA]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewAlbumOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#5F6368] dark:text-[#C2C7CF] hover:bg-slate-100 dark:hover:bg-[#282A2C] rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newAlbumName.trim()}
                  className="gp-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
