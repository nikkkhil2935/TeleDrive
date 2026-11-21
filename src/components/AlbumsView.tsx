import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { FolderHeart, Plus, Image as ImageIcon, X } from 'lucide-react';
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

    // If there were selected photos, add them
    await bulkAddToAlbum(newAlbumName.trim());

    setNewAlbumName('');
    setIsNewAlbumOpen(false);
  };

  const handleSelectAlbum = (albumName: string) => {
    setSelectedAlbum(albumName);
    setActiveTab('photos');
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-sky-500" />
            <span>Albums</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stored directly as tags in Telegram caption metadata
          </p>
        </div>

        <button
          onClick={() => setIsNewAlbumOpen(true)}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Album</span>
        </button>
      </div>

      {/* Albums Grid */}
      {albumsData.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <FolderHeart className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No albums yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create an album to organize your photos into collections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albumsData.map((album) => (
            <div
              key={album.name}
              onClick={() => handleSelectAlbum(album.name)}
              className="group cursor-pointer space-y-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 hover:shadow-lg transition-all"
            >
              <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-950 overflow-hidden relative border border-slate-100 dark:border-slate-800">
                {album.coverUrl ? (
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="px-1">
                <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {album.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {album.count} {album.count === 1 ? 'item' : 'items'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Album Modal */}
      {isNewAlbumOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create Album</h3>
              <button onClick={() => setIsNewAlbumOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4">
              <input
                type="text"
                autoFocus
                placeholder="Album name (e.g. Summer Vacation)"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewAlbumOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-sm"
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
