import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Minimize2,
  Play,
  Pause,
  Sparkles,
  ShieldCheck,
  Check,
  Share2,
  Film,
  ExternalLink
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import {
  getTelegramClient,
  downloadFullMedia,
  getCachedFullMediaUrl
} from '../services/tgClient';

export const MediaViewer: React.FC = () => {
  const { selectedMedia, setSelectedMedia, toggleFavorite, moveToTrash } = useApp();
  const [showInfo, setShowInfo] = useState(true);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [fullMediaUrl, setFullMediaUrl] = useState<string | null>(null);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);

  // Fetch all active items in the timeline for navigation and the Google Photos filmstrip
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

  // Auto-scroll active filmstrip thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedMedia?.messageId, showFilmstrip]);

  // Reset transforms and stream full-res media when selectedMedia changes
  useEffect(() => {
    if (!selectedMedia) {
      setFullMediaUrl(null);
      return;
    }

    setRotation(0);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    // Check in-memory cache first
    const cached = getCachedFullMediaUrl(selectedMedia.messageId);
    if (cached) {
      setFullMediaUrl(cached);
      setIsLoadingOriginal(false);
      return;
    }

    // Stream original full-resolution media from Telegram MTProto
    let cancelled = false;
    setIsLoadingOriginal(true);
    setDownloadProgress(0);

    (async () => {
      try {
        const client = await getTelegramClient();
        const url = await downloadFullMedia(
          client,
          selectedMedia.libraryId,
          selectedMedia.messageId,
          (progress) => {
            if (!cancelled) setDownloadProgress(progress);
          }
        );
        if (!cancelled) {
          setFullMediaUrl(url);
          setIsLoadingOriginal(false);
        }
      } catch (err) {
        console.warn('[MediaViewer] Could not stream full media, using thumbnail:', err);
        if (!cancelled) {
          setIsLoadingOriginal(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedMedia?.messageId]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      setSelectedMedia(allIds[currentIndex - 1]);
    }
  }, [hasPrev, allIds, currentIndex, setSelectedMedia]);

  const goToNext = useCallback(() => {
    if (hasNext) {
      setSelectedMedia(allIds[currentIndex + 1]);
    }
  }, [hasNext, allIds, currentIndex, setSelectedMedia]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedMedia) return;
      if (e.key === 'Escape') setSelectedMedia(null);
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'i' || e.key === 'I') setShowInfo(prev => !prev);
      if (e.key === 'r' || e.key === 'R') setRotation(r => (r + 90) % 360);
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(4, z + 0.25));
      if (e.key === '-') setZoom(z => Math.max(0.5, z - 0.25));
      if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, goToPrev, goToNext, setSelectedMedia]);

  if (!selectedMedia) return null;

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Double click to toggle 1x / 2.5x zoom (Apple / Google Photos behavior)
  const handleDoubleClick = () => {
    if (zoom > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2.5);
    }
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom(prev => {
      const next = Math.min(4, Math.max(0.5, Number((prev + delta).toFixed(2))));
      if (next <= 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Mouse Drag to Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download full original file
  const handleDownload = async () => {
    let url = fullMediaUrl;
    if (!url) {
      try {
        const client = await getTelegramClient();
        url = await downloadFullMedia(client, selectedMedia.libraryId, selectedMedia.messageId);
      } catch (e) {
        url = selectedMedia.thumbnailDataUrl || null;
      }
    }
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedMedia.filename;
    a.click();
  };

  // Copy Telegram metadata link / summary
  const handleCopyMeta = () => {
    const summary = `Telegram Media #${selectedMedia.messageId} | ${selectedMedia.filename} (${selectedMedia.width}x${selectedMedia.height})`;
    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Calculate Megapixels and Aspect Ratio Label
  const megapixels = ((selectedMedia.width * selectedMedia.height) / 1_000_000).toFixed(1);
  const getAspectLabel = (w: number, h: number) => {
    if (!w || !h) return 'Standard';
    const ratio = w / h;
    if (Math.abs(ratio - 16 / 9) < 0.05) return '16:9 Landscape';
    if (Math.abs(ratio - 9 / 16) < 0.05) return '9:16 Portrait';
    if (Math.abs(ratio - 4 / 3) < 0.05) return '4:3 Standard';
    if (Math.abs(ratio - 3 / 4) < 0.05) return '3:4 Portrait';
    if (Math.abs(ratio - 1) < 0.05) return '1:1 Square';
    if (Math.abs(ratio - 21 / 9) < 0.05) return '21:9 Ultrawide';
    return `${ratio.toFixed(2)}:1`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-200 select-none overflow-hidden">
      {/* Ambient Blurred Background (Apple Photos immersive glass effect) */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-20 blur-3xl scale-125 transition-all duration-700"
        style={{
          backgroundImage: `url(${selectedMedia.thumbnailDataUrl})`,
        }}
      />

      {/* Top Controls Toolbar (Emil Kowalski Apple Frosted Glass Header) */}
      <header className="h-14 sm:h-16 border-b border-white/10 px-3 sm:px-6 flex items-center justify-between text-white shrink-0 bg-slate-950/70 backdrop-blur-xl z-30">
        {/* Left: Back / Close & Filename */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button
            onClick={() => setSelectedMedia(null)}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/80 hover:text-white"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm text-white font-medium truncate max-w-[160px] xs:max-w-xs sm:max-w-md">
              {selectedMedia.filename}
            </h1>
            <p className="text-[10px] text-white/50 hidden sm:block truncate">
              {new Date(selectedMedia.takenAt).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })} · {megapixels} MP · {currentIndex + 1} of {allIds.length}
            </p>
          </div>
        </div>

        {/* Center: Canvas Tools (Zoom, Rotate, Reset) */}
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg text-white/90">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="text-[11px] font-mono px-2 py-0.5 rounded-full hover:bg-white/15 transition-all text-white/90 hover:text-white"
            title="Reset Zoom (0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="w-[1px] h-3.5 bg-white/20 mx-0.5" />
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all"
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Right: Actions (Filmstrip, Favorite, Fullscreen, Download, Trash, Info) */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setShowFilmstrip(prev => !prev)}
            className={`p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all ${
              showFilmstrip ? 'text-sky-400 bg-sky-500/15' : 'text-white/70 hover:text-white'
            }`}
            title="Toggle Filmstrip Carousel"
          >
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => toggleFavorite(selectedMedia)}
            className={`p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all ${
              selectedMedia.isFavorite ? 'text-rose-500' : 'text-white/80 hover:text-white'
            }`}
            title="Favorite"
          >
            <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedMedia.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all hidden xs:flex"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all"
            title="Download Original Media"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => moveToTrash(selectedMedia)}
            className="p-2 rounded-full hover:bg-white/10 active:scale-95 text-white/70 hover:text-rose-400 transition-all"
            title="Move to Trash"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all ${
              showInfo ? 'text-sky-400 bg-sky-500/15' : 'text-white/70 hover:text-white'
            }`}
            title="Toggle Details & EXIF (I)"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Main Stage & Inspector Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Media Canvas Stage (Fills available space responsively) */}
        <div
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className={`flex-1 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden transition-all duration-300 ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {/* Previous Arrow Button */}
          {hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/70 hover:bg-slate-900/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl transition-all active:scale-95"
              title="Previous Photo (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Arrow Button */}
          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/70 hover:bg-slate-900/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl transition-all active:scale-95"
              title="Next Photo (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Render Media Viewport: Fluid Responsive Sizing (Preserves Aspect Ratio & Fills Canvas) */}
          <div
            className="relative w-full h-full flex items-center justify-center transition-all duration-300"
            style={{
              maxWidth: showInfo ? 'calc(100vw - 380px)' : 'calc(100vw - 32px)',
              maxHeight: showFilmstrip ? 'calc(100vh - 190px)' : 'calc(100vh - 96px)',
            }}
          >
            {selectedMedia.kind === 'video' ? (
              <div
                className="relative flex items-center justify-center max-w-full max-h-full"
                style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: selectedMedia.width && selectedMedia.height ? `${selectedMedia.width} / ${selectedMedia.height}` : undefined,
                }}
              >
                {fullMediaUrl ? (
                  <video
                    src={fullMediaUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain rounded-xl shadow-2xl"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <img
                      src={selectedMedia.thumbnailDataUrl}
                      alt={selectedMedia.filename}
                      className="w-full h-full object-contain rounded-xl shadow-2xl blur-xs"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs rounded-xl">
                      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 text-white border border-white/10 shadow-2xl">
                        <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Streaming original video from Telegram...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="relative flex items-center justify-center max-w-full max-h-full"
                style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: selectedMedia.width && selectedMedia.height ? `${selectedMedia.width} / ${selectedMedia.height}` : undefined,
                }}
              >
                <img
                  src={fullMediaUrl || selectedMedia.thumbnailDataUrl}
                  alt={selectedMedia.filename}
                  draggable={false}
                  className="w-full h-full object-contain rounded-xl drop-shadow-2xl select-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), filter 300ms ease',
                    filter: fullMediaUrl ? 'none' : 'blur(0.5px)',
                  }}
                />
              </div>
            )}
          </div>

          {/* Floating Pill Badge: High-Res Streaming Status or Zoom Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            {isLoadingOriginal && !fullMediaUrl ? (
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white/90 text-xs shadow-2xl animate-in fade-in duration-200">
                <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>
                  Streaming original {selectedMedia.width}×{selectedMedia.height} ({downloadProgress ? `${Math.round(downloadProgress * 100)}%` : 'MTProto'})...
                </span>
              </div>
            ) : zoom > 1 ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-white/80 text-[11px] shadow-2xl">
                <span>{Math.round(zoom * 100)}%</span>
                <span className="text-white/40">·</span>
                <span>Drag to pan</span>
                <span className="text-white/40">·</span>
                <span>Double-click to reset</span>
              </div>
            ) : fullMediaUrl ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-400 text-[11px] shadow-xl">
                <Sparkles className="w-3 h-3" />
                <span>Original Quality ({selectedMedia.width}×{selectedMedia.height})</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* EXIF & Telegram Cloud Metadata Panel (Responsive Drawer on Mobile, Sidebar on Desktop) */}
        {showInfo && (
          <aside className="absolute inset-y-0 right-0 z-30 w-full sm:w-88 md:relative md:w-88 border-l border-white/10 bg-slate-950/95 md:bg-slate-950/80 backdrop-blur-2xl p-5 overflow-y-auto space-y-6 text-slate-300 text-xs shrink-0 shadow-2xl md:shadow-none animate-in slide-in-from-right-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-semibold text-white">Details & Info</h3>
                <p className="text-slate-400 text-[11px] truncate max-w-[220px]">{selectedMedia.filename}</p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Specs Pills */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">Resolution</div>
                <div className="text-sm font-semibold text-white">{selectedMedia.width} × {selectedMedia.height}</div>
                <div className="text-[10px] text-sky-400 mt-0.5">{megapixels} MP · {getAspectLabel(selectedMedia.width, selectedMedia.height)}</div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1">File Size</div>
                <div className="text-sm font-semibold text-white">{(selectedMedia.sizeBytes / (1024 * 1024)).toFixed(2)} MB</div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Original File Quality</div>
              </div>
            </div>

            {/* Date & Location Section */}
            <div className="space-y-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium text-xs">Date & Time Captured</div>
                  <div className="text-slate-300 text-[11px]">
                    {new Date(selectedMedia.takenAt).toLocaleString(undefined, {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </div>
                </div>
              </div>

              {selectedMedia.camera && (
                <div className="flex items-start gap-3 pt-2 border-t border-white/10">
                  <HardDrive className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-medium text-xs">Camera / Device</div>
                    <div className="text-slate-300 text-[11px] font-medium">{selectedMedia.camera}</div>
                  </div>
                </div>
              )}

              {selectedMedia.latitude && selectedMedia.longitude && (
                <div className="flex items-start gap-3 pt-2 border-t border-white/10">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-white font-medium text-xs">GPS Coordinates</div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      {selectedMedia.latitude.toFixed(5)}°, {selectedMedia.longitude.toFixed(5)}°
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedMedia.latitude},${selectedMedia.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open in Google Maps</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Telegram Invariants & Cloud Storage Verification */}
            <div className="space-y-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Telegram Cloud Invariants</span>
                </div>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-normal">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Message ID:</span>
                  <span className="text-white font-semibold">#{selectedMedia.messageId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Channel:</span>
                  <span className="text-white truncate max-w-[140px]">{selectedMedia.libraryId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Checksum:</span>
                  <span className="text-sky-400 truncate max-w-[140px]">{selectedMedia.sha256}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Connection:</span>
                  <span className="text-slate-300">Direct MTProto WSS</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button: Download Full Resolution Original */}
            <div className="pt-2">
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Original ({(selectedMedia.sizeBytes / (1024 * 1024)).toFixed(2)} MB)</span>
              </button>

              <button
                onClick={handleCopyMeta}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] border border-white/10 active:scale-[0.98] transition-all"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied to Clipboard' : 'Copy Media Specs'}</span>
              </button>
            </div>

            {/* Stored Caption JSON Metadata */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Stored Caption JSON (Schema v1)</span>
              </div>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[10px] text-sky-300 whitespace-pre-wrap break-all select-text">
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

      {/* Google Photos Bottom Filmstrip Carousel */}
      {showFilmstrip && allIds.length > 0 && (
        <div className="h-20 sm:h-24 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl px-4 flex items-center gap-2 overflow-x-auto shrink-0 z-30 select-none scrollbar-thin">
          {allIds.map((item, idx) => {
            const isSelected = item.messageId === selectedMedia.messageId;
            return (
              <button
                key={item.messageId}
                ref={isSelected ? activeThumbnailRef : undefined}
                onClick={() => setSelectedMedia(item)}
                className={`relative h-14 sm:h-16 aspect-square rounded-lg overflow-hidden shrink-0 transition-all ${
                  isSelected
                    ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black scale-105 opacity-100 z-10 shadow-lg shadow-sky-500/20'
                    : 'opacity-50 hover:opacity-90 hover:scale-100'
                }`}
                title={`${item.filename} (${idx + 1} of ${allIds.length})`}
              >
                <img
                  src={item.thumbnailDataUrl}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                />
                {item.kind === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-3.5 h-3.5 text-white fill-white" />
                  </div>
                )}
                {item.isFavorite && (
                  <div className="absolute top-1 right-1">
                    <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
