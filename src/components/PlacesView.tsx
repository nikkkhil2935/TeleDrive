import React, { useState, useMemo } from 'react';
import {
  MapPin,
  ArrowLeft,
  ExternalLink,
  Play,
  Heart,
  Navigation,
  Compass
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '../context/AppContext';
import { db } from '../db';
import type { MediaItem } from '../types';

interface PlaceGroup {
  name: string;
  lat?: number;
  lon?: number;
  items: MediaItem[];
  coverUrl?: string;
}

export const PlacesView: React.FC = () => {
  const { session, setSelectedMedia } = useApp();
  const [selectedPlace, setSelectedPlace] = useState<PlaceGroup | null>(null);

  const activeScope = session?.channelId || session?.userId || 'me';

  const allMedia = useLiveQuery(
    async () => {
      if (!session) return [];
      const items = await db.media.where('libraryId').equals(activeScope).toArray();
      return items.filter(m => !m.trashedAt && !m.isArchived);
    },
    [session?.channelId, session?.userId],
    []
  );

  // Group media into distinct places
  const placeGroups = useMemo(() => {
    if (!allMedia || allMedia.length === 0) return [];
    const map = new Map<string, PlaceGroup>();

    for (const item of allMedia) {
      let placeName = item.placeName;
      if (!placeName) {
        if (item.latitude && item.longitude) {
          // Format coordinates into place title
          placeName = `Location (${item.latitude.toFixed(2)}°, ${item.longitude.toFixed(2)}°)`;
        } else if (/sunset|mountain|alps/i.test(item.filename)) {
          placeName = 'Alpine Mountains';
        } else if (/city|street|urban/i.test(item.filename)) {
          placeName = 'City & Landmarks';
        } else if (/beach|coast|sea|water/i.test(item.filename)) {
          placeName = 'Coastal & Nature';
        } else {
          placeName = 'Saved Places';
        }
      }

      if (!map.has(placeName)) {
        map.set(placeName, {
          name: placeName,
          lat: item.latitude,
          lon: item.longitude,
          items: [],
          coverUrl: item.thumbnailDataUrl,
        });
      }
      map.get(placeName)!.items.push(item);
    }

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [allMedia]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFD] dark:bg-[#131314] select-none">
      {selectedPlace ? (
        // Place Photos Grid
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 sm:px-8 border-b border-slate-200 dark:border-[#444746]/40 flex items-center justify-between bg-white dark:bg-[#1E1F20]/60 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedPlace(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#282A2C] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors"
                title="Back to all places"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <span>{selectedPlace.name}</span>
                </h2>
                <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF]">
                  {selectedPlace.items.length} {selectedPlace.items.length === 1 ? 'photo' : 'photos'}
                </p>
              </div>
            </div>

            {selectedPlace.lat && selectedPlace.lon && (
              <a
                href={`https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gp-btn-tonal text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 sm:gap-1.5">
              {selectedPlace.items.map((item) => (
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
        // Places Overview Grid
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-200 dark:border-[#444746]/40">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight flex items-center gap-2">
              <Compass className="w-6 h-6 text-emerald-500" />
              <span>Places</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6368] dark:text-[#C2C7CF] mt-1">
              Explore your photos and videos organized by where you captured them.
            </p>
          </div>

          {placeGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {placeGroups.map((place) => (
                <div
                  key={place.name}
                  onClick={() => setSelectedPlace(place)}
                  className="group relative rounded-3xl overflow-hidden bg-white dark:bg-[#1E1F20] border border-slate-200 dark:border-[#444746]/50 shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.015]"
                >
                  {/* Place Cover & Collage */}
                  <div className="aspect-video w-full bg-slate-200 dark:bg-[#282A2C] overflow-hidden relative">
                    {place.coverUrl ? (
                      <img
                        src={place.coverUrl}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <MapPin className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-semibold text-sm drop-shadow-md truncate">
                        {place.name}
                      </h3>
                      <p className="text-[11px] text-white/80 mt-0.5">
                        {place.items.length} {place.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="p-3 flex items-center justify-between text-xs text-[#5F6368] dark:text-[#C2C7CF]">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Location Tagged</span>
                    </span>
                    <span className="text-[#0B57D0] dark:text-[#A8C7FA] font-medium group-hover:underline">
                      View photos →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                No places detected yet
              </h3>
              <p className="text-xs text-[#5F6368] dark:text-[#C2C7CF] max-w-sm mt-1">
                Photos with GPS location metadata or location tags will automatically appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
