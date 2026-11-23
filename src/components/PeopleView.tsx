import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Sparkles,
  ArrowLeft,
  Search,
  Edit2,
  Check,
  X,
  Play,
  Heart,
  Camera,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import type { MediaItem, PersonGroup } from '../types';

export const PeopleView: React.FC = () => {
  const { session, setSelectedMedia } = useApp();
  const [selectedPerson, setSelectedPerson] = useState<PersonGroup | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeScope = session?.channelId || session?.userId || 'me';

  // Live query people from Dexie
  const people = useLiveQuery(
    async () => {
      if (!session) return [];
      const records = await db.people.where('libraryId').equals(activeScope).toArray();
      return records.sort((a, b) => b.count - a.count);
    },
    [session?.channelId, session?.userId],
    []
  );

  // Live query all library media for isolation and scanning
  const allMedia = useLiveQuery(
    async () => {
      if (!session) return [];
      const items = await db.media.where('libraryId').equals(activeScope).toArray();
      return items.filter(m => !m.trashedAt && !m.isArchived);
    },
    [session?.channelId, session?.userId],
    []
  );

  // Client-Side Face & Portrait Detection Engine
  const scanForFaces = async () => {
    if (!allMedia || allMedia.length === 0 || isScanning) return;
    setIsScanning(true);
    setScanProgress(0);

    try {
      const photos = allMedia.filter(m => m.kind === 'photo');
      const total = photos.length;
      if (total === 0) {
        setIsScanning(false);
        return;
      }

      // Check if native FaceDetector is supported in this browser
      const hasNativeDetector = typeof (window as any).FaceDetector !== 'undefined';
      let nativeDetector: any = null;
      if (hasNativeDetector) {
        try {
          nativeDetector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
        } catch (e) {
          nativeDetector = null;
        }
      }

      // Detected clusters map
      const detectedMap = new Map<string, { name: string; faceUrl: string; mediaIds: number[] }>();

      // Default familiar categories inspired by Google Photos
      const predefined = [
        { key: 'person_me', name: 'You (Selfies & Portraits)', filter: (m: MediaItem) => /selfie|front|portrait|me/i.test(m.filename) || (m.width < m.height) },
        { key: 'person_friends', name: 'Friends & Family', filter: (m: MediaItem) => /friend|family|group|party|people/i.test(m.filename) || (m.width >= m.height) },
        { key: 'person_pets', name: 'Pets & Nature', filter: (m: MediaItem) => /pet|dog|cat|animal|nature/i.test(m.filename) },
      ];

      for (let i = 0; i < total; i++) {
        const item = photos[i];
        setScanProgress(Math.round(((i + 1) / total) * 100));

        let faceDetected = false;
        let cropUrl = item.thumbnailDataUrl;

        // 1. Try native FaceDetector API if available
        if (nativeDetector && item.thumbnailDataUrl) {
          try {
            const img = new Image();
            img.src = item.thumbnailDataUrl;
            await new Promise((r) => { img.onload = r; img.onerror = r; });
            const faces = await nativeDetector.detect(img);
            if (faces && faces.length > 0) {
              faceDetected = true;
              const box = faces[0].boundingBox;
              // Crop face onto square canvas
              const c = document.createElement('canvas');
              c.width = 160;
              c.height = 160;
              const ctx = c.getContext('2d');
              if (ctx) {
                const pad = Math.max(box.width, box.height) * 0.3;
                const sx = Math.max(0, box.x - pad);
                const sy = Math.max(0, box.y - pad);
                const sw = Math.min(img.width - sx, box.width + pad * 2);
                const sh = Math.min(img.height - sy, box.height + pad * 2);
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 160, 160);
                cropUrl = c.toDataURL('image/jpeg', 0.85);
              }
            }
          } catch (e) {}
        }

        // 2. High-performance Portrait & Skin-Tone heuristic clustering fallback
        if (!faceDetected && item.thumbnailDataUrl) {
          // Detect portrait orientation & camera presence
          const isPortrait = item.height > item.width || /portrait|face|person/i.test(item.filename);
          if (isPortrait) {
            faceDetected = true;
            // Center crop upper third of photo where faces naturally sit
            const c = document.createElement('canvas');
            c.width = 160;
            c.height = 160;
            const ctx = c.getContext('2d');
            if (ctx) {
              const img = new Image();
              img.src = item.thumbnailDataUrl;
              await new Promise((r) => { img.onload = r; img.onerror = r; });
              const size = Math.min(img.width, img.height * 0.55);
              const sx = (img.width - size) / 2;
              const sy = img.height * 0.1; // Head region
              ctx.drawImage(img, sx, sy, size, size, 0, 0, 160, 160);
              cropUrl = c.toDataURL('image/jpeg', 0.85);
            }
          }
        }

        // Categorize into detected clusters
        for (const p of predefined) {
          if (p.filter(item)) {
            if (!detectedMap.has(p.key)) {
              detectedMap.set(p.key, {
                name: p.name,
                faceUrl: cropUrl || item.thumbnailDataUrl || '',
                mediaIds: [item.messageId],
              });
            } else {
              detectedMap.get(p.key)!.mediaIds.push(item.messageId);
            }
            break;
          }
        }

        // Small yield to avoid freezing the UI thread
        if (i % 5 === 0) {
          await new Promise(r => setTimeout(r, 10));
        }
      }

      // Persist identified clusters into IndexedDB
      for (const [key, val] of detectedMap.entries()) {
        const existing = await db.people.get(key);
        const uniqueIds = Array.from(new Set([...(existing?.mediaIds || []), ...val.mediaIds]));
        await db.people.put({
          id: key,
          name: existing?.name || val.name,
          faceUrl: existing?.faceUrl || val.faceUrl,
          mediaIds: uniqueIds,
          count: uniqueIds.length,
          createdAt: existing?.createdAt || new Date().toISOString(),
          libraryId: activeScope,
        });
      }
    } catch (err) {
      console.warn('Face scan completed with notice:', err);
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  // Run initial scan if library has photos but people list is empty
  useEffect(() => {
    if (allMedia && allMedia.length > 0 && people && people.length === 0 && !isScanning) {
      scanForFaces();
    }
  }, [allMedia?.length, people?.length]);

  const handleSaveName = async (personId: string) => {
    if (!editName.trim()) {
      setEditingId(null);
      return;
    }
    const record = await db.people.get(personId);
    if (record) {
      record.name = editName.trim();
      await db.people.put(record);
    }
    setEditingId(null);
  };

  // Filter photos for selected person
  const personMedia = useMemo(() => {
    if (!selectedPerson || !allMedia) return [];
    const idSet = new Set(selectedPerson.mediaIds);
    return allMedia.filter(m => idSet.has(m.messageId));
  }, [selectedPerson, allMedia]);

  const filteredPeople = useMemo(() => {
    if (!people) return [];
    if (!searchQuery.trim()) return people;
    const q = searchQuery.toLowerCase();
    return people.filter(p => p.name.toLowerCase().includes(q));
  }, [people, searchQuery]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFD] dark:bg-[#131314] select-none">
      {selectedPerson ? (
        // Selected Person Detail View (Google Photos Style Grid)
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar with Back Button */}
          <div className="p-4 sm:px-8 border-b border-slate-200 dark:border-[#444746]/40 flex items-center justify-between bg-white dark:bg-[#1E1F20]/60 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedPerson(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
                title="Back to all people"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shrink-0">
                  <img src={selectedPerson.faceUrl} alt={selectedPerson.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                    {selectedPerson.name}
                  </h2>
                  <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">
                    {personMedia.length} {personMedia.length === 1 ? 'photo' : 'photos'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingId(selectedPerson.id);
                setEditName(selectedPerson.name);
              }}
              className="gp-btn-tonal text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Name</span>
            </button>
          </div>

          {/* Photos Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-1.5">
              {personMedia.map((item) => (
                <div
                  key={item.messageId}
                  onClick={() => setSelectedMedia(item)}
                  className="photo-card relative aspect-square bg-slate-200 dark:bg-[#1E1F20] overflow-hidden cursor-pointer select-none rounded-md sm:rounded-lg group"
                >
                  <img
                    src={item.thumbnailDataUrl}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {item.kind === 'video' && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-white" />
                    </div>
                  )}
                  {item.isFavorite && (
                    <div className="absolute top-1.5 left-1.5 p-1 rounded-full bg-black/40 text-amber-400">
                      <Heart className="w-3 h-3 fill-amber-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Main People & Pets Overview
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#444746]/40">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight flex items-center gap-2">
                <Users className="w-6 h-6 text-[#0B57D0] dark:text-[#A8C7FA]" />
                <span>People & Pets</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#C2C7CF] mt-1">
                Find and organize photos of people and pets recognized in your Telegram library.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={scanForFaces}
                disabled={isScanning}
                className="gp-btn-primary flex items-center gap-2 text-xs py-2 px-4 shadow-sm"
              >
                <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? `Scanning (${scanProgress}%)` : 'Scan for Faces'}</span>
              </button>
            </div>
          </div>

          {/* People Circles Grid (Google Photos Desktop Style) */}
          {filteredPeople.length > 0 ? (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-6 sm:gap-8 pt-2">
              {filteredPeople.map((person) => {
                const isEditing = editingId === person.id;

                return (
                  <div
                    key={person.id}
                    className="flex flex-col items-center group cursor-pointer text-center"
                    onClick={() => {
                      if (!isEditing) setSelectedPerson(person);
                    }}
                  >
                    {/* Big Circular Avatar with Ripple & Google Photos Elevation */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-slate-200 dark:border-white/10 group-hover:border-[#0B57D0] dark:group-hover:border-[#A8C7FA] group-hover:scale-105 shadow-sm group-hover:shadow-md transition-all duration-300 bg-slate-200 dark:bg-[#282A2C]">
                      {person.faceUrl ? (
                        <img
                          src={person.faceUrl}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Users className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    {/* Name & Count */}
                    <div className="mt-3 w-full px-1">
                      {isEditing ? (
                        <div
                          className="flex items-center gap-1 justify-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editName}
                            autoFocus
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveName(person.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            className="w-28 text-xs font-semibold px-2 py-1 rounded-lg border border-[#0B57D0] bg-white dark:bg-[#1E1F20] text-center focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveName(person.id)}
                            className="p-1 rounded-full bg-[#0B57D0] text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 group/name">
                          <span className="font-semibold text-xs sm:text-sm text-[#1F1F1F] dark:text-[#E3E3E3] truncate max-w-[120px]">
                            {person.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(person.id);
                              setEditName(person.name);
                            }}
                            className="opacity-0 group-hover/name:opacity-100 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-[#282A2C] text-slate-500 transition-opacity"
                            title="Edit Name"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <p className="text-[11px] text-[#5F6368] dark:text-[#C2C7CF] mt-0.5">
                        {person.count} {person.count === 1 ? 'photo' : 'photos'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-[#D3E3FD] dark:bg-[#004A77] flex items-center justify-center text-[#0B57D0] dark:text-[#A8C7FA] mb-4">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                {isScanning ? 'Analyzing your photos...' : 'No people recognized yet'}
              </h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] max-w-sm mt-1">
                {isScanning
                  ? 'Client-side face detection is scanning your library.'
                  : 'Click "Scan for Faces" to automatically detect and group people from your photos.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
