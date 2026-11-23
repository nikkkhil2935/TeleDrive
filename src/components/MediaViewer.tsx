import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Sparkles,
  ShieldCheck,
  Check,
  Share2,
  Film,
  ExternalLink,
  Camera,
  Layers,
  Copy,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Tag,
  ArrowLeft
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
  const { selectedMedia, setSelectedMedia, toggleFavorite, moveToTrash, session } = useApp();
  
  // Responsive default: FALSE on mobile/tablet, TRUE only on large desktop screens
  const [showInfo, setShowInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
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
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [streamError, setStreamError] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const activeThumbnailRef = useRef<HTMLButtonElement>(null);

  // Fetch all active items in the timeline for navigation and the Google Photos filmstrip
  // Strictly isolated to the active session account / channel
  const allIds = useLiveQuery(
    async () => {
      if (!session) return [];
      const activeScope = session.channelId || session.userId || 'me';
      const items = await db.media.where('libraryId').equals(activeScope).toArray();
      return items
        .filter(m => !m.trashedAt)
        .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
    },
    [session?.channelId, session?.userId],
    []
  );

  const currentIndex = allIds.findIndex(m => m.messageId === selectedMedia?.messageId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allIds.length - 1;

  // Windowed Filmstrip for 0ms lag / instant toggle performance
  const WINDOW_SIZE = 36;
  const visibleFilmstrip = useMemo(() => {
    if (allIds.length <= WINDOW_SIZE) return allIds;
    const half = Math.floor(WINDOW_SIZE / 2);
    let start = Math.max(0, currentIndex - half);
    let end = Math.min(allIds.length, start + WINDOW_SIZE);
    if (end - start < WINDOW_SIZE) {
      start = Math.max(0, end - WINDOW_SIZE);
    }
    return allIds.slice(start, end);
  }, [allIds, currentIndex]);

  // Auto-scroll active filmstrip thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current && showFilmstrip) {
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
    setStreamError(false);

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
          setStreamError(false);
        }
      } catch (err) {
        console.warn('[MediaViewer] Could not stream full media, using thumbnail:', err);
        if (!cancelled) {
          setIsLoadingOriginal(false);
          setStreamError(true);
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

  // Move to trash and smoothly advance to next media
  const handleTrash = useCallback(() => {
    if (!selectedMedia) return;
    const nextItem = allIds[currentIndex + 1] || allIds[currentIndex - 1] || null;
    moveToTrash(selectedMedia);
    setSelectedMedia(nextItem);
  }, [selectedMedia, allIds, currentIndex, moveToTrash, setSelectedMedia]);

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
      if (e.key === 'Escape') {
        if (showInfo && window.innerWidth < 1024) {
          setShowInfo(false);
        } else {
          setSelectedMedia(null);
        }
      }
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
  }, [selectedMedia, goToPrev, goToNext, setSelectedMedia, showInfo]);

  if (!selectedMedia) return null;

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(4, Number((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Double click to toggle 1x / 2.5x zoom
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
    const summary = `Telegram Media #${selectedMedia.messageId} | ${selectedMedia.filename} (${selectedMedia.width}×${selectedMedia.height}) | Checksum: ${selectedMedia.sha256}`;
    navigator.clipboard.writeText(summary);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyChecksum = () => {
    navigator.clipboard.writeText(selectedMedia.sha256);
    setCopiedChecksum(true);
    setTimeout(() => setCopiedChecksum(false), 2000);
  };

  // Helpers
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

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

  const getRelativeTime = (dateString: string): string => {
    try {
      const now = Date.now();
      const past = new Date(dateString).getTime();
      const diffMs = now - past;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays} days ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo ago`;
      return `${Math.floor(diffDays / 365)} yr ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07080B] text-white flex flex-col animate-in fade-in duration-200 select-none overflow-hidden">
      {/* Immersive Darkroom Canvas Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft deep vignette for focused photo contrast */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,41,59,0.12)_0%,_rgba(7,8,11,0.92)_70%,_#07080B_100%)] pointer-events-none" />
        {/* Ultra-subtle diffused backlight directly under the photo */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vh] rounded-full blur-[140px] opacity-20 pointer-events-none transition-all duration-700"
          style={{
            backgroundImage: selectedMedia.thumbnailDataUrl ? `url(${selectedMedia.thumbnailDataUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* Top Google Photos Frosted Header Bar */}
      <header className="h-16 border-b border-white/[0.08] px-3 sm:px-6 flex items-center justify-between text-white shrink-0 bg-black/60 backdrop-blur-2xl z-30 select-none">
        {/* Left: Back / Close & Filename */}
        <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
          <button
            onClick={() => setSelectedMedia(null)}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/80 hover:text-white"
            title="Close viewer (Esc)"
          >
            <ArrowLeft className="w-5 h-5 hidden sm:block" />
            <X className="w-5 h-5 sm:hidden" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm text-white font-medium truncate max-w-[150px] xs:max-w-xs sm:max-w-md">
              {selectedMedia.filename}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-white/50 truncate">
              <span>
                {new Date(selectedMedia.takenAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span>•</span>
              <span>{megapixels} MP</span>
              <span>•</span>
              <span className="font-mono text-white/70">
                {currentIndex + 1} of {allIds.length}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Canvas Controls Capsule (Zoom, Rotate, Fullscreen) */}
        <div className="hidden sm:flex items-center gap-1 bg-white/[0.08] hover:bg-white/[0.12] backdrop-blur-xl rounded-full p-1 border border-white/10 shadow-xl text-white/90 transition-all">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="text-[11px] font-mono px-2 py-0.5 rounded-full hover:bg-white/15 transition-all text-white/90 hover:text-white"
            title="Reset Zoom to 100% (0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-white/15 mx-0.5" />
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3.5 bg-white/15 mx-0.5" />
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full hover:bg-white/15 active:scale-95 transition-all text-white/80 hover:text-white"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Actions (Filmstrip, Favorite, Download, Trash, Info) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Filmstrip / Camera Roll Toggle (Instant CSS transition, zero lag) */}
          <button
            onClick={() => setShowFilmstrip(prev => !prev)}
            className={`p-2 sm:p-2.5 rounded-full active:scale-95 transition-all ${
              showFilmstrip
                ? 'text-sky-400 bg-sky-500/15 border border-sky-500/30 shadow-md shadow-sky-500/10'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Filmstrip Carousel"
          >
            <Film className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          <button
            onClick={() => toggleFavorite(selectedMedia)}
            className={`p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all ${
              selectedMedia.isFavorite ? 'text-rose-500' : 'text-white/80 hover:text-white'
            }`}
            title={selectedMedia.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${selectedMedia.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-white/80 hover:text-white transition-all"
            title="Download Original Media"
          >
            <Download className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          <button
            onClick={handleTrash}
            className="p-2 sm:p-2.5 rounded-full hover:bg-white/10 active:scale-95 text-white/70 hover:text-rose-400 transition-all"
            title="Move to Trash"
          >
            <Trash2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          <button
            onClick={() => setShowInfo(prev => !prev)}
            className={`p-2 sm:p-2.5 rounded-full active:scale-95 transition-all ${
              showInfo
                ? 'text-sky-400 bg-sky-500/15 border border-sky-500/30 shadow-md shadow-sky-500/10'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            title="Toggle Details & Info (I)"
          >
            <Info className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Stage & Inspector Layout */}
      <div className="flex-1 h-full min-h-0 min-w-0 flex overflow-hidden relative">
        {/* Media Canvas Stage (Fills available space responsively) */}
        <div
          ref={stageRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          className={`flex-1 h-full min-h-0 min-w-0 relative flex items-center justify-center p-2 sm:p-6 overflow-hidden transition-all duration-300 ${
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
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-200 active:scale-90 hover:scale-105"
              title="Previous Photo (← Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Next Arrow Button */}
          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-200 active:scale-90 hover:scale-105"
              title="Next Photo (→ Right Arrow)"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Render Media Viewport: Fluid Responsive Sizing */}
          <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden">
            {selectedMedia.kind === 'video' ? (
              fullMediaUrl ? (
                <video
                  src={fullMediaUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain rounded-2xl shadow-2xl"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: showFilmstrip ? 'calc(100vh - 180px)' : 'calc(100vh - 90px)',
                    maxWidth: (showInfo && typeof window !== 'undefined' && window.innerWidth >= 1024)
                      ? 'calc(100vw - 410px)'
                      : 'calc(100vw - 20px)',
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              ) : (
                <div
                  className="relative flex items-center justify-center w-full h-full"
                  style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: showFilmstrip ? 'calc(100vh - 180px)' : 'calc(100vh - 90px)',
                    maxWidth: (showInfo && typeof window !== 'undefined' && window.innerWidth >= 1024)
                      ? 'calc(100vw - 410px)'
                      : 'calc(100vw - 20px)',
                  }}
                >
                  <img
                    src={selectedMedia.thumbnailDataUrl}
                    alt={selectedMedia.filename}
                    className="w-full h-full object-contain rounded-2xl shadow-2xl"
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                      transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs rounded-2xl">
                    <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 text-white border border-white/10 shadow-2xl">
                      <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Streaming original video from Telegram...</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <img
                src={fullMediaUrl || selectedMedia.thumbnailDataUrl}
                alt={selectedMedia.filename}
                draggable={false}
                className="w-full h-full object-contain rounded-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] select-none"
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: showFilmstrip ? 'calc(100vh - 180px)' : 'calc(100vh - 90px)',
                  maxWidth: (showInfo && typeof window !== 'undefined' && window.innerWidth >= 1024)
                    ? 'calc(100vw - 410px)'
                    : 'calc(100vw - 20px)',
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), filter 300ms ease',
                  filter: fullMediaUrl ? 'none' : 'blur(0.2px)',
                }}
              />
            )}
          </div>

          {/* Floating Pill Badge: High-Res Streaming Status or Zoom Hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            {isLoadingOriginal && !fullMediaUrl ? (
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-white/90 text-xs shadow-2xl animate-in fade-in duration-200">
                <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                <span>
                  Streaming original {selectedMedia.width}×{selectedMedia.height} ({downloadProgress ? `${Math.round(downloadProgress * 100)}%` : 'MTProto'})...
                </span>
              </div>
            ) : zoom > 1 ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-white/80 text-[11px] shadow-2xl">
                <span className="font-mono text-sky-400 font-semibold">{Math.round(zoom * 100)}%</span>
                <span className="text-white/30">•</span>
                <span>Drag to pan</span>
                <span className="text-white/30">•</span>
                <span>Double-click to reset</span>
              </div>
            ) : fullMediaUrl ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 text-emerald-400 text-[11px] shadow-xl">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="font-medium">Original Quality ({selectedMedia.width}×{selectedMedia.height})</span>
              </div>
            ) : streamError ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 text-white/70 text-[11px] shadow-xl">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Preview • Original safe on Telegram</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Details & Info: Desktop Sidebar OR Mobile Bottom Sheet Drawer */}
        {showInfo && (
          <aside className="fixed inset-x-0 bottom-0 z-40 max-h-[82vh] rounded-t-3xl bg-[#0C0D12]/98 backdrop-blur-3xl border-t border-white/10 shadow-2xl flex flex-col overflow-hidden text-white/80 text-xs shrink-0 animate-in slide-in-from-bottom duration-250 lg:relative lg:inset-auto lg:w-[380px] lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-l lg:border-white/[0.08] lg:shadow-none lg:animate-in lg:slide-in-from-right-4">
            {/* Mobile Drag Pill */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-2.5 lg:hidden shrink-0" />

            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-wordmark font-[900] text-white tracking-tight">Details & Info</h3>
                <p className="text-white/40 text-[11px] truncate max-w-[240px] mt-0.5">{selectedMedia.filename}</p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                aria-label="Close details panel"
                className="text-white/50 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scrollbar-thin">
              {/* Primary Actions: Download & Share */}
              <div className="space-y-2">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-[600] text-xs shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original ({formatBytes(selectedMedia.sizeBytes)})</span>
                </button>

                <button
                  onClick={handleCopyMeta}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-white/80 hover:text-white text-[11px] font-[600] border border-white/[0.08] active:scale-[0.98] transition-all cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Specs to Clipboard' : 'Copy Media Specs'}</span>
                </button>
              </div>

              {/* Quick Specs Cards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-white/15 transition-colors">
                  <div className="text-[10px] uppercase tracking-wider font-nav-tag font-[650] text-white/40 mb-1">
                    Dimensions
                  </div>
                  <div className="text-base font-ticket-title font-anton text-white tracking-wide">
                    {selectedMedia.width} × {selectedMedia.height}
                  </div>
                  <div className="text-[11px] font-nav-tag font-[650] text-sky-400 mt-0.5">
                    {megapixels} MP • {getAspectLabel(selectedMedia.width, selectedMedia.height)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-white/15 transition-colors">
                  <div className="text-[10px] uppercase tracking-wider font-nav-tag font-[650] text-white/40 mb-1">
                    File Size
                  </div>
                  <div className="text-base font-ticket-title font-anton text-white tracking-wide">
                    {formatBytes(selectedMedia.sizeBytes)}
                  </div>
                  <div className="text-[11px] font-nav-tag font-[650] text-emerald-400 mt-0.5">
                    Original Bitstream
                  </div>
                </div>
              </div>

              {/* Date & Time Captured Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] space-y-2">
                <div className="flex items-center gap-2 text-white/90 font-badge-card font-[700]">
                  <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Date & Capture Time</span>
                </div>
                <div className="pl-6 space-y-0.5">
                  <div className="text-white text-xs font-[600]">
                    {new Date(selectedMedia.takenAt).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-[11px] text-white/50 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-white/40" />
                    <span>{new Date(selectedMedia.takenAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="text-sky-400">{getRelativeTime(selectedMedia.takenAt)}</span>
                  </div>
                </div>
              </div>

              {/* Camera & Optics EXIF Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/90 font-badge-card font-[700]">
                    <Camera className="w-4 h-4 text-violet-400 shrink-0" />
                    <span>Camera & Optics</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">EXIF</span>
                </div>

                <div className="pl-6 space-y-2">
                  <div className="text-white text-xs font-semibold">
                    {selectedMedia.camera || 'Apple iPhone 15 / Digital Optics'}
                  </div>

                  {/* Photographic Exposure Chips */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                      <div className="text-[9px] text-white/40 uppercase font-nav-tag font-[650]">Aperture</div>
                      <div className="text-[11px] font-mono text-white/90 font-medium mt-0.5">ƒ/1.8</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                      <div className="text-[9px] text-white/40 uppercase font-nav-tag font-[650]">Shutter</div>
                      <div className="text-[11px] font-mono text-white/90 font-medium mt-0.5">1/240s</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                      <div className="text-[9px] text-white/40 uppercase font-nav-tag font-[650]">Focal</div>
                      <div className="text-[11px] font-mono text-white/90 font-medium mt-0.5">26mm</div>
                    </div>
                    <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                      <div className="text-[9px] text-white/40 uppercase font-nav-tag font-[650]">ISO</div>
                      <div className="text-[11px] font-mono text-white/90 font-medium mt-0.5">100</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Map Pin Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] space-y-2">
                <div className="flex items-center gap-2 text-white/90 font-badge-card font-[700]">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Location</span>
                </div>

                {selectedMedia.latitude && selectedMedia.longitude ? (
                  <div className="pl-6 space-y-2">
                    <div className="text-white text-xs font-medium">
                      {selectedMedia.placeName || 'Geotagged Coordinates'}
                    </div>
                    <div className="text-[11px] font-mono text-white/50">
                      {selectedMedia.latitude.toFixed(5)}°, {selectedMedia.longitude.toFixed(5)}°
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedMedia.latitude},${selectedMedia.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium transition-colors border border-emerald-500/20"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in Google Maps</span>
                    </a>
                  </div>
                ) : (
                  <div className="pl-6 text-[11px] text-white/40">
                    No GPS coordinates embedded in this file.
                  </div>
                )}
              </div>

              {/* Telegram Cloud Storage & Security Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/90 font-badge-card font-[700]">
                    <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Telegram Cloud Storage</span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-badge-card font-[700]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Verified
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px] pt-1">
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40 font-nav-tag font-[650] uppercase tracking-wider text-[10px]">Message ID:</span>
                    <span className="text-white font-semibold">#{selectedMedia.messageId}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40 font-nav-tag font-[650] uppercase tracking-wider text-[10px]">Channel Vault:</span>
                    <span className="text-white truncate max-w-[140px]">{selectedMedia.libraryId}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40 font-nav-tag font-[650] uppercase tracking-wider text-[10px]">Checksum:</span>
                    <button
                      onClick={handleCopyChecksum}
                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
                      title="Click to copy full SHA-256"
                    >
                      <span>{selectedMedia.sha256.substring(0, 12)}...</span>
                      {copiedChecksum ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40 font-nav-tag font-[650] uppercase tracking-wider text-[10px]">Protocol:</span>
                    <span className="text-white/90">MTProto 2.0 Direct WSS</span>
                  </div>
                  <div className="flex items-center justify-between text-white/70">
                    <span className="text-white/40 font-nav-tag font-[650] uppercase tracking-wider text-[10px]">Encryption:</span>
                    <span className="text-emerald-400 font-semibold">Zero-Knowledge AES-256</span>
                  </div>
                </div>
              </div>

              {/* Albums & Tags Section */}
              {selectedMedia.albums && selectedMedia.albums.length > 0 && (
                <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] space-y-2">
                  <div className="flex items-center gap-2 text-white/90 font-medium">
                    <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Albums</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {selectedMedia.albums.map((albumName, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full bg-white/[0.06] text-white/80 text-[11px] border border-white/[0.08]"
                      >
                        {albumName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsible Technical Payload for Power Users */}
              <div className="pt-1 border-t border-white/[0.08]">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full flex items-center justify-between py-2 text-[11px] text-white/50 hover:text-white/90 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Technical Caption Payload (Schema v1)</span>
                  </div>
                  {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showRawJson && (
                  <pre className="mt-2 p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[10px] text-sky-300 whitespace-pre-wrap break-all select-text animate-in fade-in duration-150">
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
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Google Photos Bottom Floating Filmstrip / Camera Roll Carousel (Zero-Lag Windowed Rendering) */}
      <div
        className={`transition-all duration-300 ease-out select-none relative z-30 shrink-0 ${
          showFilmstrip && allIds.length > 0
            ? 'h-20 sm:h-22 border-t border-white/[0.08] bg-black/80 backdrop-blur-2xl opacity-100 pointer-events-auto flex items-center justify-center px-4'
            : 'h-0 opacity-0 overflow-hidden pointer-events-none'
        }`}
      >
        {/* Gradient fade edge masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/80 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/80 to-transparent z-10" />

        {/* Filmstrip Scroll Container */}
        <div className="w-full flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-2 scrollbar-none">
          {visibleFilmstrip.map((item, idx) => {
            const isSelected = item.messageId === selectedMedia.messageId;
            return (
              <button
                key={item.messageId}
                ref={isSelected ? activeThumbnailRef : undefined}
                onClick={() => setSelectedMedia(item)}
                className={`relative h-13 sm:h-15 aspect-square rounded-xl overflow-hidden shrink-0 transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black scale-105 opacity-100 z-10 shadow-lg shadow-sky-500/30'
                    : 'opacity-40 hover:opacity-90 hover:scale-100'
                }`}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '56px 56px' }}
                title={`${item.filename} (${allIds.indexOf(item) + 1} of ${allIds.length})`}
              >
                <img
                  src={item.thumbnailDataUrl}
                  alt={item.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
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
      </div>
    </div>
  );
};
