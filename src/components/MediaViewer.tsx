import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Trash2,
  Download,
  Info,
  MapPin,
  Calendar,
  HardDrive,
  FileText,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';

export const MediaViewer: React.FC = () => {
  const { selectedMedia, setSelectedMedia, toggleFavorite, moveToTrash } = useApp();
  const [showInfo, setShowInfo] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Fetch adjacent items for arrow navigation
  const allIds = useLiveQuery(
    async () => {
      const items = await db.media.orderBy('takenAt').reverse().toArray();
      return items.filter(m => !m.trashedAt);
    },
    [],
    []
  );

  const currentIndex = allIds.findIndex(m => m.messageId === selectedMedia?.messageId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allIds.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      setRotation(0);
      setZoom(1);
      setSelectedMedia(allIds[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setRotation(0);
      setZoom(1);
      setSelectedMedia(allIds[currentIndex + 1]);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMedia) return;
      if (e.key === 'Escape') setSelectedMedia(null);
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, currentIndex, allIds]);

  if (!selectedMedia) return null;

  const handleDownload = () => {
    if (!selectedMedia.thumbnailDataUrl) return;
    const a = document.createElement('a');
    a.href = selectedMedia.thumbnailDataUrl;
    a.download = selectedMedia.filename;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-200 select-none">
      {/* Top Controls Toolbar */}
      <div className="h-14 border-b border-white/10 px-6 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedMedia(null)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-xs text-white/80 font-medium truncate max-w-xs sm:max-w-md">
            {selectedMedia.filename}
          </div>
        </div>

        {/* Center Canvas Tools */}
        <div className="hidden sm:flex items-center gap-1 bg-white/10 rounded-lg p-1 text-white/80">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-1.5 rounded hover:bg-white/10 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="p-1.5 rounded hover:bg-white/10 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-3 bg-white/20 mx-1" />
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-1.5 rounded hover:bg-white/10 hover:text-white"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(selectedMedia)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${selectedMedia.isFavorite ? 'text-rose-500' : 'text-white'}`}
            title="Favorite"
          >
            <Heart className={`w-5 h-5 ${selectedMedia.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Download Media"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={() => moveToTrash(selectedMedia)}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-rose-400 transition-colors"
            title="Move to Trash"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-full hover:bg-white/10 transition-colors ${showInfo ? 'text-sky-400' : 'text-white/70'}`}
            title="Info / EXIF"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Stage & Inspector Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Previous Button */}
        {hasPrev && (
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xl transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {hasNext && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xl transition-all"
            style={{ right: showInfo ? '336px' : '16px' }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Media Canvas Stage */}
        <div className="flex-1 relative flex items-center justify-center p-8 overflow-hidden">
          {selectedMedia.kind === 'video' ? (
            <div className="relative max-w-4xl max-h-full rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 flex flex-col items-center">
              {selectedMedia.thumbnailDataUrl && (
                <img
                  src={selectedMedia.thumbnailDataUrl}
                  alt={selectedMedia.filename}
                  className="max-h-[68vh] w-auto object-contain"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                    transition: 'transform 0.2s ease',
                  }}
                />
              )}
              {/* Video Player Controls Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 flex items-center justify-center text-white"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <span>{selectedMedia.durationMs ? `${Math.round(selectedMedia.durationMs / 1000)}s` : '0:42'}</span>
                </div>
                <div className="text-[11px] text-sky-400 font-mono">
                  Telegram Document Stream (Message #{selectedMedia.messageId})
                </div>
              </div>
            </div>
          ) : (
            <img
              src={selectedMedia.thumbnailDataUrl}
              alt={selectedMedia.filename}
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transition: 'transform 0.2s ease',
              }}
            />
          )}
        </div>

        {/* EXIF & Telegram Metadata Panel */}
        {showInfo && (
          <aside className="w-80 border-l border-white/10 bg-slate-900/90 backdrop-blur-xl p-5 overflow-y-auto space-y-6 text-slate-300 text-xs shrink-0">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Details</h3>
              <p className="text-slate-400 break-all">{selectedMedia.filename}</p>
            </div>

            {/* Date & Dimensions */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-white font-medium">Date Taken</div>
                  <div className="text-slate-400">{new Date(selectedMedia.takenAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="text-white font-medium">File Specs</div>
                  <div className="text-slate-400">
                    {selectedMedia.width} × {selectedMedia.height} · {(selectedMedia.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              </div>

              {selectedMedia.latitude && selectedMedia.longitude && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-white font-medium">Location Coordinates</div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      {selectedMedia.latitude.toFixed(4)}°, {selectedMedia.longitude.toFixed(4)}°
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Telegram Invariants & Caption JSON */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Telegram Document Invariants</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/50 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1">
                <div>Message ID: #{selectedMedia.messageId}</div>
                <div>Target Channel: {selectedMedia.libraryId}</div>
                <div className="truncate">SHA-256: {selectedMedia.sha256}</div>
              </div>

              <div className="text-[11px] text-slate-400 font-medium pt-2">Stored Caption JSON (Schema v1):</div>
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-sky-300 whitespace-pre-wrap break-all">
                {JSON.stringify({
                  v: 1,
                  taken: selectedMedia.takenAt,
                  w: selectedMedia.width,
                  h: selectedMedia.height,
                  sha: selectedMedia.sha256.substring(0, 16),
                  name: selectedMedia.filename,
                  albums: selectedMedia.albums,
                  fav: selectedMedia.isFavorite ? 1 : 0,
                }, null, 2)}
              </pre>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
